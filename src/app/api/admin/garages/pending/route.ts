import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GarageApprovalStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "PENDING"; // PENDING, INFO_REQUESTED, or all
    const region = (searchParams.get("region") || "").trim();
    const dateFrom = (searchParams.get("dateFrom") || "").trim();
    const dateTo = (searchParams.get("dateTo") || "").trim();
    const sortByRaw = (searchParams.get("sortBy") || "createdAt").trim();
    const sortOrderRaw = (searchParams.get("sortOrder") || "desc")
      .trim()
      .toLowerCase();
    const sortOrder = sortOrderRaw === "asc" ? "asc" : "desc";

    const allowedSortBy = new Set([
      "createdAt",
      "name",
      "city",
      "postcode",
      "id",
    ]);
    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : "createdAt";

    // Build where clause based on status filter
    // Always filter to show only PENDING and INFO_REQUESTED garages (not APPROVED or REJECTED)
    let statusFilter: any = {};
    try {
      if (status === "all") {
        // Default: show only PENDING and INFO_REQUESTED (not APPROVED or REJECTED)
        statusFilter = {
          approvalStatus: {
            in: [
              GarageApprovalStatus.PENDING,
              GarageApprovalStatus.INFO_REQUESTED,
            ],
          },
        };
      } else {
        // Validate status is a valid enum value
        const validStatuses = Object.values(GarageApprovalStatus);
        if (validStatuses.includes(status as GarageApprovalStatus)) {
          const statusValue = status as GarageApprovalStatus;
          // Only allow PENDING or INFO_REQUESTED in pending garages page
          if (statusValue === GarageApprovalStatus.PENDING || statusValue === GarageApprovalStatus.INFO_REQUESTED) {
            statusFilter = { approvalStatus: statusValue };
          } else {
            // If trying to filter by APPROVED or REJECTED, return empty (they shouldn't be in pending page)
            statusFilter = { approvalStatus: { in: [] } }; // Empty result
          }
        } else {
          // Default to PENDING if invalid status provided
          statusFilter = { approvalStatus: GarageApprovalStatus.PENDING };
        }
      }
    } catch (error) {
      // If GarageApprovalStatus enum doesn't exist, use string values directly
      // Always filter to exclude APPROVED and REJECTED
      console.warn(
        "GarageApprovalStatus enum not available, using string values",
      );
      if (status === "all") {
        statusFilter = {
          approvalStatus: {
            in: ["PENDING", "INFO_REQUESTED"],
          },
        };
      } else if (status === "PENDING" || status === "INFO_REQUESTED") {
        statusFilter = { approvalStatus: status };
      } else {
        // Default to PENDING
        statusFilter = { approvalStatus: "PENDING" };
      }
    }

    const and: any[] = [];

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          {
            owner: { name: { contains: search, mode: "insensitive" as const } },
          },
          {
            owner: {
              email: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      });
    }

    if (region) {
      and.push({
        OR: [
          { city: { contains: region, mode: "insensitive" as const } },
          { postcode: { contains: region, mode: "insensitive" as const } },
          { address: { contains: region, mode: "insensitive" as const } },
        ],
      });
    }

    if (dateFrom || dateTo) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!Number.isNaN(from.getTime())) createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!Number.isNaN(to.getTime())) {
          to.setUTCHours(23, 59, 59, 999);
          createdAt.lte = to;
        }
      }
      if (createdAt.gte || createdAt.lte) and.push({ createdAt });
    }

    // Build where clause
    const where: any = {};

    // Always add statusFilter - it should always have content
    // This ensures we only show PENDING and INFO_REQUESTED garages (not APPROVED or REJECTED)
    Object.assign(where, statusFilter);

    // Add AND conditions if any
    if (and.length > 0) {
      where.AND = and;
    }

    const orderBy = { [sortBy]: sortOrder } as any;

    // Try to fetch garages with approvalLogs, but fallback if the relation doesn't exist
    let garages: any[];
    let total: number;

    try {
      // First try with approvalLogs included
      [garages, total] = await Promise.all([
        prisma.garage.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                emailVerified: true,
                createdAt: true,
              },
            },
            approvalLogs: {
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                admin: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.garage.count({ where }),
      ]);
    } catch (error: any) {
      // Check if error is specifically about approvalLogs (relation) or approvalStatus (field)
      const isApprovalLogsError = error?.message?.includes("approvalLogs") || 
                                   error?.message?.includes("GarageApprovalLog");
      const isApprovalStatusError = error?.message?.includes("approvalStatus") &&
                                    !isApprovalLogsError;

      if (isApprovalLogsError) {
        // If error is only about approvalLogs, retry without it but keep approvalStatus filter
        console.warn(
          "approvalLogs not available, fetching without logs:",
          error.message,
        );

        // Keep the where clause as is (including approvalStatus filter)
        const whereWithoutLogs = { ...where };

        [garages, total] = await Promise.all([
          prisma.garage.findMany({
            where: whereWithoutLogs,
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  emailVerified: true,
                  createdAt: true,
                },
              },
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.garage.count({ where: whereWithoutLogs }),
        ]);

        // Add empty approvalLogs array
        garages = garages.map((garage) => ({
          ...garage,
          approvalLogs: [],
        }));
      } else if (isApprovalStatusError) {
        // If error is about approvalStatus field not existing, use fallback
        console.warn(
          "approvalStatus field not available, using fallback filter:",
          error.message,
        );

        // Fallback: filter by isActive = false (pending garages are typically inactive)
        // This is not perfect but better than showing all garages
        const whereFallback: any = {
          isActive: false,
        };
        if (where.AND) {
          whereFallback.AND = where.AND;
        }

        [garages, total] = await Promise.all([
          prisma.garage.findMany({
            where: whereFallback,
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  emailVerified: true,
                  createdAt: true,
                },
              },
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.garage.count({ where: whereFallback }),
        ]);

        // Add default approvalStatus to each garage
        garages = garages.map((garage) => ({
          ...garage,
          approvalStatus: garage.approvalStatus || "PENDING",
          approvalLogs: [],
        }));
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    return NextResponse.json({
      garages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending garages:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    );
  }
}

# Garage Admin - Usage Guide

## 🚀 Quick Start

### Accessing the New Features

1. **Login** to your garage admin account
2. **Navigate** to `/garage-admin` (Dashboard)
3. **Look** at the left sidebar - you'll see two new menu items:
   - 👥 **Clientes** (Customers)
   - 🚗 **Veículos** (Vehicles)

---

## 👥 Customers Management

### What You Can Do

- **View all customers** who have made bookings at your garage
- **Search** for specific customers by name, email, or phone
- **See customer details**:
  - Name and contact information
  - Total number of bookings
  - Last booking date
  - Customer status (active/inactive)
  - When they joined

### How to Use

1. **Click "Clientes"** in the sidebar
2. **Browse** the list of customers
3. **Search** using the search box:
   - Type customer name, email, or phone number
   - Results update automatically
4. **Navigate** between pages using Previous/Next buttons
5. **View Details** by clicking "Ver detalhes" button (coming soon)

### Understanding Customer Status

- **🟢 Ativo (Active)**: Customer has made bookings at your garage
- **⚪ Inativo (Inactive)**: Customer has no active bookings

### Example Scenarios

**Scenario 1: Find a specific customer**
- Click "Clientes"
- Type customer name in search box
- View their booking history and contact info

**Scenario 2: See all your customers**
- Click "Clientes"
- Browse through all pages
- See total bookings per customer

**Scenario 3: Contact a customer**
- Click "Clientes"
- Find customer in list
- Use email or phone to contact them

---

## 🚗 Vehicles Management

### What You Can Do

- **View all vehicles** that have had bookings at your garage
- **Search** for specific vehicles by registration, make, model, or owner
- **See vehicle details**:
  - Registration/Plate number
  - Make, model, and year
  - Owner name
  - Total bookings at your garage
  - Last booking date
  - **MOT Status** with color-coded badges

### How to Use

1. **Click "Veículos"** in the sidebar
2. **Browse** the list of vehicles
3. **Search** using the search box:
   - Type registration (e.g., "WJ11USE")
   - Type make (e.g., "Toyota")
   - Type model (e.g., "Prius")
   - Type owner name
4. **Navigate** between pages using Previous/Next buttons
5. **Check MOT Status** - see the colored badge:
   - 🟢 **MOT Válido** (Green) - MOT is valid
   - 🟡 **Expirando em breve** (Yellow) - MOT expires within 30 days
   - 🔴 **MOT Expirado** (Red) - MOT has expired
   - 🔴 **MOT Falhou** (Red) - MOT test failed
   - ⚪ **Desconhecido** (Gray) - No MOT history

### Understanding MOT Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Valid | MOT is current and valid | No action needed |
| 🟡 Expiring Soon | MOT expires within 30 days | Remind customer to book MOT |
| 🔴 Expired | MOT has passed expiry date | Cannot perform MOT test |
| 🔴 Failed | Last MOT test failed | Customer needs to fix issues |
| ⚪ Unknown | No MOT history available | Check DVSA records |

### Example Scenarios

**Scenario 1: Find a vehicle by registration**
- Click "Veículos"
- Type registration number in search box
- View vehicle details and MOT status

**Scenario 2: Check MOT status of all vehicles**
- Click "Veículos"
- Look at the colored MOT status badges
- Identify vehicles needing attention

**Scenario 3: Find vehicles with expiring MOT**
- Click "Veículos"
- Look for 🟡 yellow badges
- Contact owners to remind them to book MOT

**Scenario 4: Find vehicles by owner**
- Click "Veículos"
- Type owner name in search box
- See all vehicles owned by that person

---

## 🔍 Search Tips

### Customers Search
- **By Name**: Type full or partial name (e.g., "John" or "John Doe")
- **By Email**: Type email address (e.g., "john@example.com")
- **By Phone**: Type phone number (e.g., "07700123456")
- **Case Insensitive**: Search works regardless of uppercase/lowercase

### Vehicles Search
- **By Registration**: Type plate number (e.g., "WJ11USE")
- **By Make**: Type car brand (e.g., "Toyota", "Ford")
- **By Model**: Type car model (e.g., "Prius", "Focus")
- **By Owner**: Type owner name (e.g., "John Doe")
- **Case Insensitive**: Search works regardless of uppercase/lowercase

---

## 📊 Pagination

Both pages show **10 items per page**:

- **Previous Button**: Go to previous page (disabled on page 1)
- **Next Button**: Go to next page (disabled on last page)
- **Page Indicator**: Shows current page and total pages

Example: "Mostrando página 1 de 3" = Showing page 1 of 3

---

## 🎯 Common Tasks

### Task 1: Find a customer's booking history
1. Click "Clientes"
2. Search for customer name
3. Click "Ver detalhes" (coming soon)
4. View all their bookings

### Task 2: Check MOT status of a vehicle
1. Click "Veículos"
2. Search for vehicle registration
3. Look at the MOT status badge
4. Check last MOT date

### Task 3: Contact customers with expiring MOT
1. Click "Veículos"
2. Look for 🟡 yellow "Expirando em breve" badges
3. Note the owner names
4. Click "Clientes" and search for those owners
5. Use their email/phone to contact them

### Task 4: Export customer list
1. Click "Clientes"
2. Click "Exportar" button (coming soon)
3. Download CSV file

### Task 5: Filter vehicles by status
1. Click "Veículos"
2. Click "Filtrar" button (coming soon)
3. Select MOT status filter
4. View filtered results

---

## ⚙️ Settings & Preferences

### Sorting (Future Feature)
- Sort customers by name, bookings, or join date
- Sort vehicles by registration, make, model, or MOT status

### Filtering (Future Feature)
- Filter customers by status (active/inactive)
- Filter vehicles by MOT status
- Filter by date range

### Export (Future Feature)
- Export to CSV format
- Export to PDF format
- Email reports

---

## 🆘 Troubleshooting

### No customers showing
- **Possible Cause**: No bookings at your garage yet
- **Solution**: Wait for customers to make bookings

### No vehicles showing
- **Possible Cause**: No bookings at your garage yet
- **Solution**: Wait for customers to book MOT tests

### Search not working
- **Possible Cause**: Exact match required
- **Solution**: Try partial search terms

### MOT status showing "Unknown"
- **Possible Cause**: Vehicle has no MOT history
- **Solution**: Check DVSA records or wait for first MOT test

### Page not loading
- **Possible Cause**: Network issue or authentication expired
- **Solution**: Refresh page or login again

---

## 📱 Mobile Compatibility

Both pages are **fully responsive**:
- ✅ Works on desktop
- ✅ Works on tablet
- ✅ Works on mobile
- ✅ Touch-friendly buttons
- ✅ Optimized layout for small screens

---

## 🔐 Data Privacy

- ✅ Only you can see your garage's data
- ✅ Customer information is secure
- ✅ Data is encrypted in transit
- ✅ No data is shared with third parties

---

## 📞 Support

### Getting Help

1. **Check this guide** for common questions
2. **Review the features documentation** at `GARAGE_ADMIN_FEATURES.md`
3. **Contact support** if you encounter issues

### Reporting Issues

If you find a bug or have suggestions:
1. Note the exact steps to reproduce
2. Take a screenshot if possible
3. Contact the development team

---

## 🎓 Best Practices

1. **Regular Check**: Review customers and vehicles regularly
2. **MOT Reminders**: Check for expiring MOT and contact customers
3. **Data Accuracy**: Keep customer information up to date
4. **Backup**: Export data regularly for backup

---

## 📅 Updates & Changes

### Version 1.0.0 (Current)
- ✅ Customers list with search and pagination
- ✅ Vehicles list with search and pagination
- ✅ MOT status indicators
- ✅ Responsive design

### Coming Soon
- 🔜 Customer detail pages
- 🔜 Vehicle detail pages
- 🔜 Advanced filtering
- 🔜 Export to CSV/PDF
- 🔜 Bulk actions
- 🔜 Analytics dashboard

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0
**Status**: ✅ Ready to Use


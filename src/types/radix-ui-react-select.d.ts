declare module '@radix-ui/react-select' {
  import * as React from 'react';

  type SelectProps = {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    dir?: 'ltr' | 'rtl';
    name?: string;
    autoComplete?: string;
    disabled?: boolean;
    required?: boolean;
  };

  const Root: React.FC<SelectProps>;

  const Trigger: React.ForwardRefExoticComponent<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
  >;

  const Value: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean } & React.RefAttributes<HTMLSpanElement>
  >;

  const Icon: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean } & React.RefAttributes<HTMLSpanElement>
  >;

  const Portal: React.FC<{ children: React.ReactNode; container?: HTMLElement }>;

  const Content: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      position?: 'item-aligned' | 'popper';
      side?: 'top' | 'right' | 'bottom' | 'left';
      sideOffset?: number;
      align?: 'start' | 'center' | 'end';
      alignOffset?: number;
      avoidCollisions?: boolean;
      collisionBoundary?: Element | null | Array<Element | null>;
      collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
      arrowPadding?: number;
      sticky?: 'partial' | 'always';
      hideWhenDetached?: boolean;
      asChild?: boolean;
    } & React.RefAttributes<HTMLDivElement>
  >;

  const Viewport: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  const Item: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      value: string;
      disabled?: boolean;
      textValue?: string;
      asChild?: boolean;
    } & React.RefAttributes<HTMLDivElement>
  >;

  const ItemText: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean } & React.RefAttributes<HTMLSpanElement>
  >;

  const ItemIndicator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean } & React.RefAttributes<HTMLSpanElement>
  >;

  const ScrollUpButton: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  const ScrollDownButton: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  const Group: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  const Label: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  const Separator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean } & React.RefAttributes<HTMLDivElement>
  >;

  export {
    Root,
    Trigger,
    Value,
    Icon,
    Portal,
    Content,
    Viewport,
    Item,
    ItemText,
    ItemIndicator,
    ScrollUpButton,
    ScrollDownButton,
    Group,
    Label,
    Separator,
  };
}
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
  hover?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    icon, 
    gradient = false, 
    hover = true,
    shadow = 'md',
    children, 
    ...props 
  }, ref) => {
    const shadowClasses = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "border-0 backdrop-blur-sm",
          shadowClasses[shadow],
          gradient && "bg-gradient-to-br from-card via-card to-primary/5",
          hover && "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
          className
        )}
        {...props}
      >
        {(title || subtitle || icon) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              {title && (
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {icon && <div className="text-muted-foreground">{icon}</div>}
          </CardHeader>
        )}
        <CardContent className={cn(title || subtitle || icon ? "pt-0" : "")}>
          {children}
        </CardContent>
      </Card>
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

interface MetricValueProps {
  value: string | number;
  label?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const MetricValue: React.FC<MetricValueProps> = ({ 
  value, 
  label, 
  color = 'default',
  size = 'md'
}) => {
  const colorClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    success: 'text-green-600 dark:text-green-500',
    warning: 'text-yellow-600 dark:text-yellow-500',
    error: 'text-red-600 dark:text-red-500'
  };

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div>
      <div className={cn("font-bold", sizeClasses[size], colorClasses[color])}>
        {value}
      </div>
      {label && (
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      )}
    </div>
  );
};

export { EnhancedCard, MetricValue };
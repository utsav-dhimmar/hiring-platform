import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function DashboardBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const breadcrumbItems = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    const isLast = index === pathnames.length - 1;

    // Capitalize and format name
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");

    return (
      <React.Fragment key={routeTo}>
        <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
          {isLast ? (
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link to={routeTo} />}>{displayName}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />}
      </React.Fragment>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
    </Breadcrumb>
  );
}

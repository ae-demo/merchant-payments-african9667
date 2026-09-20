import type { JSX } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { Inbox, Users, Receipt, TriangleAlert, LogOut } from "@wso2/oxygen-ui-icons-react";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { APP_NAME } from "../appName";

const NAV_ITEMS = [
  { id: "onboarding-queue", label: "Onboarding", to: "/onboarding", icon: <Inbox size={18} />, op: "GET /merchants" as const },
  { id: "merchants", label: "Merchants", to: "/merchants", icon: <Users size={18} />, op: "GET /merchants" as const },
  {
    id: "all-transactions",
    label: "Transactions",
    to: "/transactions",
    icon: <Receipt size={18} />,
    op: "GET /transactions" as const,
  },
  {
    id: "disputes-queue",
    label: "Disputes",
    to: "/disputes",
    icon: <TriangleAlert size={18} />,
    op: "GET /disputes" as const,
  },
];

function activeItemFor(pathname: string): string {
  if (pathname.startsWith("/onboarding")) return "onboarding-queue";
  if (pathname.startsWith("/merchants")) return "merchants";
  if (pathname.startsWith("/transactions")) return "all-transactions";
  if (pathname.startsWith("/disputes")) return "disputes-queue";
  return "";
}

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();
  const roleLabel = roles.length > 0 ? roles.join(", ") : undefined;

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email={roleLabel ?? "No role granted"} />
              <UserMenu.Logout icon={<LogOut size={16} />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={activeItemFor(pathname)}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {NAV_ITEMS.map((item) => (
                <Can op={item.op} key={item.id}>
                  <Sidebar.Item id={item.id} link={<Link to={item.to} />}>
                    <Sidebar.ItemIcon>{item.icon}</Sidebar.ItemIcon>
                    <Sidebar.ItemLabel>{item.label}</Sidebar.ItemLabel>
                  </Sidebar.Item>
                </Can>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}

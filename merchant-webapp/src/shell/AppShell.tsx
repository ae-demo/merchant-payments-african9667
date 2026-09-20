// The wireframes draw two chrome shapes (wireframes.dsl): the four hub
// screens (Dashboard, PaymentLinks, Transactions, Payouts) carry both
// `navbar` and `sidebar`; every task screen reached FROM one of them
// (Onboarding, CreatePaymentLink, PaymentLinkDetail, PayoutConfirm) carries
// only `navbar`. Rather than two layout components, this one shell omits
// <AppShell.Sidebar> on a task route — @wso2/oxygen-ui's AppShell only
// renders the slots it is given, so the content area reclaims the width.
//
// /forbidden is "inside the shell, rail intact" per thunder-authentication:
// it is treated as a hub route so the navigation the caller CAN use stays
// visible.
import type { ReactElement } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { LayoutDashboard, Link2, LogOut, Receipt, Wallet } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { RAIL_SCREENS } from "../authz/screens";

const RAIL_ICON: Record<string, ReactElement> = {
  dashboard: <LayoutDashboard size={18} />,
  paymentlinks: <Link2 size={18} />,
  transactions: <Receipt size={18} />,
  payouts: <Wallet size={18} />,
};

export function AppShell(): ReactElement {
  const location = useLocation();
  const { username } = useAuthz();
  const roles = useHeldRoles();

  const activeScreen = RAIL_SCREENS.find((screen) => screen.path === location.pathname);
  const showSidebar = activeScreen !== undefined || location.pathname === "/forbidden";
  const displayName = username || "Merchant";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          {showSidebar ? <Header.Toggle /> : null}
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={displayName} />
              <UserMenu.Header
                name={displayName}
                email={username}
                role={roles.length > 0 ? roles.join(", ") : undefined}
              />
              <UserMenu.Logout icon={<LogOut size={18} />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      {showSidebar ? (
        <OxygenAppShell.Sidebar>
          <Sidebar activeItem={activeScreen?.key}>
            <Sidebar.Nav>
              <Sidebar.Category>
                {RAIL_SCREENS.map((screen) => {
                  const op = screen.loads;
                  if (!op) return null;
                  return (
                    <Can op={op} key={screen.key}>
                      <Sidebar.Item id={screen.key} link={<Link to={screen.path} />}>
                        <Sidebar.ItemIcon>{RAIL_ICON[screen.key]}</Sidebar.ItemIcon>
                        <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                      </Sidebar.Item>
                    </Can>
                  );
                })}
              </Sidebar.Category>
            </Sidebar.Nav>
          </Sidebar>
        </OxygenAppShell.Sidebar>
      ) : null}

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

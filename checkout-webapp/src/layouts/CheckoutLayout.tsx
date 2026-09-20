import { AppShell, Header } from "@wso2/oxygen-ui";
import { Outlet } from "react-router";
import type { JSX } from "react";

// The wireframe (wireframes.dsl) draws only `navbar "Checkout"` on every
// screen — no sidebar, no footer, no user menu: this is a public checkout
// page with no sign-in and no navigation rail. AppShell.Sidebar and
// AppShell.Footer are optional slots, so this shell carries only the Navbar
// and Main content.
export default function CheckoutLayout(): JSX.Element {
  return (
    <AppShell>
      <AppShell.Navbar>
        <Header minimal>
          <Header.Brand>
            <Header.BrandTitle>Checkout</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
        </Header>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

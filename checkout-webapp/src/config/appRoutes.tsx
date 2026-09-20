import { type RouteProps, Navigate } from "react-router";
import CheckoutLayout from "../layouts/CheckoutLayout";
import PaymentDetailsPage from "../pages/PaymentDetailsPage";
import MobileMoneyPayPage from "../pages/MobileMoneyPayPage";
import CardPayPage from "../pages/CardPayPage";
import PaymentResultPage from "../pages/PaymentResultPage";

export interface AppRoute extends Omit<RouteProps, "children"> {
  children?: AppRoute[];
  label?: string;
}

// This is a public hosted checkout: a customer always arrives with a real
// `linkId` on a shared payment link (`/:linkId`), so there is no home screen
// at `/` to build — it redirects to a sample link only so the app has
// something to render when opened bare (e.g. this walk).
const appRoutes: AppRoute[] = [
  { path: "/", element: <Navigate to="/demo-link" replace /> },
  {
    element: <CheckoutLayout />,
    children: [
      { path: "/:linkId", element: <PaymentDetailsPage />, label: "PaymentDetails" },
      { path: "/:linkId/mobile-money", element: <MobileMoneyPayPage />, label: "MobileMoneyPay" },
      { path: "/:linkId/card", element: <CardPayPage />, label: "CardPay" },
      { path: "/:linkId/result", element: <PaymentResultPage />, label: "PaymentResult" },
    ],
  },
];

export default appRoutes;

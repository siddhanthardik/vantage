import ServiceEditor from "@/components/admin/ServiceEditor";

export const metadata = {
  title: "Create Service | Vantage Wealth CMS",
};

export default function AdminNewServicePage() {
  return <ServiceEditor isNew={true} />;
}

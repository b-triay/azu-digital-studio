import { redirect } from 'next/navigation';

export default function StaffRootPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/portal/staff/dashboard`);
}

import AdminLTELayout from '@/Layouts/AdminLTELayout';
import { IndustryOption, PageProps } from '@/types';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    industries,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    industries: IndustryOption[];
}>) {
    return (
        <AdminLTELayout title="Profile" pageTitle="Profile Settings">
            <div className="row g-4">
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                industries={industries}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-semibold mb-3">
                                <i className="bi bi-info-circle me-2 text-primary" />
                                Account Status
                            </h5>
                            <AccountStatusCard />
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <UpdatePasswordForm />
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card border-0 shadow-sm border-start border-danger border-3">
                        <div className="card-body p-4">
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
}

function AccountStatusCard() {
    return (
        <div>
            <p className="text-muted small mb-2">
                Manage your subscription, view trial status, and access invoices.
            </p>
            <a href="#" className="btn btn-outline-primary btn-sm w-100">
                <i className="bi bi-credit-card me-1" />
                Manage Plan
            </a>
        </div>
    );
}

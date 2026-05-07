import RequestVerificationLinkForm from "../forms/RequestVerificationLinkForm";

function RequestVerificationLinkPage() {
    return(
        <>
            <div className="max-w-md mx-auto p-4">
                <h2 className="text-2xl font-semibold mb-6">Request Verification Link</h2>
                <RequestVerificationLinkForm />
            </div>
        </>
    );
}

export default RequestVerificationLinkPage;

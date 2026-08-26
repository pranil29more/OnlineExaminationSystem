import RoleRoute from "./RoleRoute";


function AdminRoute({
    children
}) {

    return (

        <RoleRoute
            allowedRoles={[
                "Admin",
                "Examiner"
            ]}
        >

            {children}

        </RoleRoute>
    );
}


export default AdminRoute;
"""Central role-to-permission policy."""

from mediai.core.enums import Permission, UserRole

ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.PATIENT: frozenset(
        {
            Permission.PREDICTION_READ,
            Permission.PREDICTION_CREATE,
            Permission.CHAT_USE,
            Permission.PROFILE_MANAGE,
        }
    ),
    UserRole.DOCTOR: frozenset(
        {
            Permission.PATIENT_READ,
            Permission.PREDICTION_REVIEW,
            Permission.CLINICAL_NOTE_CREATE,
        }
    ),
    UserRole.ADMIN: frozenset(
        {
            Permission.USER_MANAGE,
            Permission.CATALOG_MANAGE,
            Permission.MODEL_MANAGE,
            Permission.ANALYTICS_READ,
            Permission.AUDIT_READ,
        }
    ),
}


def permissions_for_role(role: UserRole) -> frozenset[Permission]:
    return ROLE_PERMISSIONS[role]

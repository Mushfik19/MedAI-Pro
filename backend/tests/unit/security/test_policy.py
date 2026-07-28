from mediai.core.enums import Permission, UserRole
from mediai.infrastructure.security.policy import permissions_for_role


def test_role_permissions_are_explicit() -> None:
    patient_permissions = permissions_for_role(UserRole.PATIENT)
    admin_permissions = permissions_for_role(UserRole.ADMIN)

    assert Permission.PREDICTION_CREATE in patient_permissions
    assert Permission.MODEL_MANAGE not in patient_permissions
    assert Permission.MODEL_MANAGE in admin_permissions

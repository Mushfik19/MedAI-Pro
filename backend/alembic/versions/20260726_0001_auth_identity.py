"""Create authentication, authorization, session, email, and audit tables.

Revision ID: 20260726_0001
Revises:
Create Date: 2026-07-26 00:01:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260726_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ROLE_IDS = {
    "PATIENT": "10000000-0000-4000-8000-000000000001",
    "DOCTOR": "10000000-0000-4000-8000-000000000002",
    "ADMIN": "10000000-0000-4000-8000-000000000003",
}

PERMISSIONS = {
    "prediction:read": "20000000-0000-4000-8000-000000000001",
    "prediction:create": "20000000-0000-4000-8000-000000000002",
    "chat:use": "20000000-0000-4000-8000-000000000003",
    "profile:manage": "20000000-0000-4000-8000-000000000004",
    "patient:read": "20000000-0000-4000-8000-000000000005",
    "prediction:review": "20000000-0000-4000-8000-000000000006",
    "clinical-note:create": "20000000-0000-4000-8000-000000000007",
    "user:manage": "20000000-0000-4000-8000-000000000008",
    "catalog:manage": "20000000-0000-4000-8000-000000000009",
    "model:manage": "20000000-0000-4000-8000-000000000010",
    "analytics:read": "20000000-0000-4000-8000-000000000011",
    "audit:read": "20000000-0000-4000-8000-000000000012",
}

ROLE_PERMISSIONS = {
    "PATIENT": {
        "prediction:read",
        "prediction:create",
        "chat:use",
        "profile:manage",
    },
    "DOCTOR": {
        "profile:manage",
        "patient:read",
        "prediction:review",
        "clinical-note:create",
        "analytics:read",
    },
    "ADMIN": set(PERMISSIONS),
}


def upgrade() -> None:
    user_role = postgresql.ENUM("PATIENT", "DOCTOR", "ADMIN", name="user_role", create_type=False)
    permission_code = postgresql.ENUM(*PERMISSIONS, name="permission_code", create_type=False)
    user_status = postgresql.ENUM(
        "PENDING_VERIFICATION",
        "ACTIVE",
        "SUSPENDED",
        "DEACTIVATED",
        name="user_status",
        create_type=False,
    )
    verification_purpose = postgresql.ENUM(
        "EMAIL_VERIFICATION",
        "PASSWORD_RESET",
        name="verification_purpose",
        create_type=False,
    )
    email_delivery_status = postgresql.ENUM(
        "PENDING",
        "PROCESSING",
        "SENT",
        "FAILED",
        name="email_delivery_status",
        create_type=False,
    )
    audit_outcome = postgresql.ENUM(
        "SUCCESS",
        "DENIED",
        "FAILURE",
        name="audit_outcome",
        create_type=False,
    )

    bind = op.get_bind()
    for enum_type in (
        user_role,
        permission_code,
        user_status,
        verification_purpose,
        email_delivery_status,
        audit_outcome,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "roles",
        sa.Column(
            "name",
            user_role,
            nullable=False,
        ),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_roles")),
        sa.UniqueConstraint("name", name=op.f("uq_roles_name")),
    )
    op.create_table(
        "permissions",
        sa.Column("code", permission_code, nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_permissions")),
        sa.UniqueConstraint("code", name=op.f("uq_permissions_code")),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("permission_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permissions.id"],
            name=op.f("fk_role_permissions_permission_id_permissions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name=op.f("fk_role_permissions_role_id_roles"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "role_id",
            "permission_id",
            name=op.f("pk_role_permissions"),
        ),
    )
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("status", user_status, nullable=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("password_changed_at", sa.DateTime(timezone=True)),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name=op.f("fk_users_role_id_roles"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index("ix_users_created_at", "users", ["created_at"])
    op.create_index("ix_users_role_status", "users", ["role_id", "status"])
    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_user_profiles_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_user_profiles")),
    )
    op.create_table(
        "user_consents",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_user_consents_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_consents")),
        sa.UniqueConstraint(
            "user_id",
            "document_id",
            name="uq_user_consents_user_id_document_id",
        ),
    )
    op.create_table(
        "refresh_sessions",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("family_id", sa.Uuid(), nullable=False),
        sa.Column("token_jti", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("csrf_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("replaced_by_id", sa.Uuid()),
        sa.Column("ip_hash", sa.String(length=64)),
        sa.Column("user_agent", sa.String(length=512)),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["replaced_by_id"],
            ["refresh_sessions.id"],
            name=op.f("fk_refresh_sessions_replaced_by_id_refresh_sessions"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_refresh_sessions_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_refresh_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_refresh_sessions_token_hash")),
        sa.UniqueConstraint("token_jti", name=op.f("uq_refresh_sessions_token_jti")),
    )
    op.create_index(
        "ix_refresh_sessions_family_id",
        "refresh_sessions",
        ["family_id"],
    )
    op.create_index(
        "ix_refresh_sessions_user_id_expires_at",
        "refresh_sessions",
        ["user_id", "expires_at"],
    )
    op.create_table(
        "verification_tokens",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("purpose", verification_purpose, nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_verification_tokens_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_verification_tokens")),
        sa.UniqueConstraint(
            "token_hash",
            name=op.f("uq_verification_tokens_token_hash"),
        ),
    )
    op.create_index(
        "ix_verification_tokens_user_purpose",
        "verification_tokens",
        ["user_id", "purpose"],
    )
    op.create_table(
        "email_outbox",
        sa.Column("recipient", sa.String(length=320), nullable=False),
        sa.Column("template", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", email_delivery_status, nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.Text()),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_email_outbox")),
    )
    op.create_index(
        "ix_email_outbox_status_created_at",
        "email_outbox",
        ["status", "created_at"],
    )
    op.create_table(
        "audit_logs",
        sa.Column("actor_id", sa.Uuid()),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("resource_type", sa.String(length=64), nullable=False),
        sa.Column("resource_id", sa.Uuid()),
        sa.Column("outcome", audit_outcome, nullable=False),
        sa.Column("request_id", sa.String(length=128), nullable=False),
        sa.Column("ip_hash", sa.String(length=64)),
        sa.Column("user_agent", sa.String(length=512)),
        sa.Column("changes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_id"],
            ["users.id"],
            name=op.f("fk_audit_logs_actor_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_logs")),
    )
    op.create_index(
        "ix_audit_logs_actor_created_at",
        "audit_logs",
        ["actor_id", "created_at"],
    )
    op.create_index(
        "ix_audit_logs_resource",
        "audit_logs",
        ["resource_type", "resource_id"],
    )

    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("name", user_role),
        sa.column("description", sa.String()),
        sa.column("is_system", sa.Boolean()),
    )
    permissions_table = sa.table(
        "permissions",
        sa.column("id", sa.Uuid()),
        sa.column("code", permission_code),
        sa.column("description", sa.String()),
    )
    role_permissions_table = sa.table(
        "role_permissions",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )
    op.bulk_insert(
        roles_table,
        [
            {
                "id": role_id,
                "name": role,
                "description": f"System {role.lower()} role",
                "is_system": True,
            }
            for role, role_id in ROLE_IDS.items()
        ],
    )
    op.bulk_insert(
        permissions_table,
        [
            {
                "id": permission_id,
                "code": code,
                "description": f"Allows {code.replace(':', ' ')} operations",
            }
            for code, permission_id in PERMISSIONS.items()
        ],
    )
    op.bulk_insert(
        role_permissions_table,
        [
            {
                "role_id": ROLE_IDS[role],
                "permission_id": PERMISSIONS[permission],
            }
            for role, permissions in ROLE_PERMISSIONS.items()
            for permission in sorted(permissions)
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_audit_logs_resource", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_created_at", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_email_outbox_status_created_at", table_name="email_outbox")
    op.drop_table("email_outbox")
    op.drop_index(
        "ix_verification_tokens_user_purpose",
        table_name="verification_tokens",
    )
    op.drop_table("verification_tokens")
    op.drop_index(
        "ix_refresh_sessions_user_id_expires_at",
        table_name="refresh_sessions",
    )
    op.drop_index("ix_refresh_sessions_family_id", table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
    op.drop_table("user_consents")
    op.drop_table("user_profiles")
    op.drop_index("ix_users_role_status", table_name="users")
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_table("users")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")

    bind = op.get_bind()
    for name in (
        "audit_outcome",
        "email_delivery_status",
        "verification_purpose",
        "user_status",
        "permission_code",
        "user_role",
    ):
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)

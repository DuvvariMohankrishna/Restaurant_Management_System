from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """
    Allows access only to users who are staff members
    or superusers.
    """

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        return (
            request.user.is_staff
            or request.user.is_superuser
        )
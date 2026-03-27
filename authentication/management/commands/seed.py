from django.core.management.base import BaseCommand
from authentication.models import User, UserRole


class Command(BaseCommand):
    help = 'Seed default users'

    def handle(self, *args, **kwargs):
        seed_users = [
            {'email': 'employee@hindujarenewables.com', 'full_name': 'Test Employee', 'role': UserRole.EMPLOYEE},
            {'email': 'admin@hindujarenewables.com', 'full_name': 'Test Admin', 'role': UserRole.ADMIN},
            {'email': 'financecontroller@hindujarenewables.com', 'full_name': 'Finance Controller', 'role': UserRole.FINANCE_CONTROLLER},
            {'email': 'sapuser@hindujarenewables.com', 'full_name': 'SAP User', 'role': UserRole.SAP_USER},
            {'email': 'superadmin@hindujarenewables.com', 'full_name': 'Super Admin', 'role': UserRole.SUPER_ADMIN},
        ]
        for u in seed_users:
            if not User.objects.filter(email=u['email']).exists():
                User.objects.create_user(password='Test@1234', **u)
                self.stdout.write(self.style.SUCCESS(f"Created: {u['email']}"))
            else:
                self.stdout.write(f"Already exists: {u['email']}")
        self.stdout.write(self.style.SUCCESS('Seed complete.'))

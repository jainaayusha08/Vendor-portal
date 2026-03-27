import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vendor_portal.settings')
django.setup()

from authentication.models import User, UserRole

def seed_users():
    users = [
        {'email': 'emp@hindujarenewables.com', 'password': 'password123', 'full_name': 'Test Employee', 'role': UserRole.EMPLOYEE},
        {'email': 'admin@hindujarenewables.com', 'password': 'password123', 'full_name': 'Test Admin', 'role': UserRole.ADMIN},
        {'email': 'sap@hindujarenewables.com', 'password': 'password123', 'full_name': 'Test SAP User', 'role': UserRole.SAP_USER},
    ]
    for u in users:
        if not User.objects.filter(email=u['email']).exists():
            User.objects.create_user(**u)
    print("Test users created!")

if __name__ == '__main__':
    seed_users()

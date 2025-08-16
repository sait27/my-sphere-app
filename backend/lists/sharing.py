import secrets
import string
from datetime import datetime, timedelta
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import List, ListShare


class ListSharingService:
    """Service for managing list sharing functionality"""
    
    @staticmethod
    def generate_share_token():
        """Generate a secure random token for sharing"""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    @staticmethod
    def create_share_link(list_obj, user, permission='view', expires_in_days=30):
        """Create a shareable link for a list"""
        if list_obj.user != user:
            raise ValidationError("You can only share your own lists")
        
        # Check if a share already exists for this list and permission
        existing_share = ListShare.objects.filter(
            list=list_obj,
            permission=permission,
            is_active=True
        ).first()
        
        if existing_share:
            # Update expiry date
            existing_share.expires_at = timezone.now() + timedelta(days=expires_in_days)
            existing_share.save()
            return existing_share
        
        # Create new share
        share = ListShare.objects.create(
            list=list_obj,
            shared_by=user,
            share_token=ListSharingService.generate_share_token(),
            permission=permission,
            expires_at=timezone.now() + timedelta(days=expires_in_days),
            is_active=True
        )
        
        return share
    
    @staticmethod
    def get_share_by_token(token):
        """Get share by token if valid and not expired"""
        try:
            share = ListShare.objects.get(
                share_token=token,
                is_active=True,
                expires_at__gt=timezone.now()
            )
            return share
        except ListShare.DoesNotExist:
            return None
    
    @staticmethod
    def revoke_share(share_id, user):
        """Revoke a share link"""
        try:
            share = ListShare.objects.get(id=share_id, list__user=user)
            share.is_active = False
            share.save()
            return True
        except ListShare.DoesNotExist:
            return False
    
    @staticmethod
    def get_user_shares(user):
        """Get all shares created by a user"""
        return ListShare.objects.filter(
            list__user=user,
            is_active=True
        ).select_related('list').order_by('-created_at')
    
    @staticmethod
    def get_shared_with_user(user):
        """Get all lists shared with a specific user"""
        return ListShare.objects.filter(
            shared_with=user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).select_related('list', 'shared_by').order_by('-created_at')
    
    @staticmethod
    def accept_share(share_token, user):
        """Accept a share invitation"""
        share = ListSharingService.get_share_by_token(share_token)
        if not share:
            raise ValidationError("Invalid or expired share link")
        
        if share.list.user == user:
            raise ValidationError("You cannot accept a share to your own list")
        
        # Add user to shared_with if not already added
        if user not in share.shared_with.all():
            share.shared_with.add(user)
            share.accepted_at = timezone.now()
            share.save()
        
        return share
    
    @staticmethod
    def can_user_access_list(list_obj, user):
        """Check if user can access a list (owner or shared with)"""
        if list_obj.user == user:
            return True, 'owner'
        
        # Check if list is shared with user
        share = ListShare.objects.filter(
            list=list_obj,
            shared_with=user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).first()
        
        if share:
            return True, share.permission
        
        return False, None
    
    @staticmethod
    def get_list_collaborators(list_obj):
        """Get all users who have access to a list"""
        shares = ListShare.objects.filter(
            list=list_obj,
            is_active=True,
            expires_at__gt=timezone.now()
        ).prefetch_related('shared_with')
        
        collaborators = []
        for share in shares:
            for user in share.shared_with.all():
                collaborators.append({
                    'user': user,
                    'permission': share.permission,
                    'accepted_at': share.accepted_at,
                    'share_id': share.id
                })
        
        return collaborators
    
    @staticmethod
    def update_share_permission(share_id, user, new_permission):
        """Update permission level for a share"""
        try:
            share = ListShare.objects.get(id=share_id, list__user=user)
            share.permission = new_permission
            share.save()
            return True
        except ListShare.DoesNotExist:
            return False
    
    @staticmethod
    def remove_collaborator(share_id, user_to_remove, list_owner):
        """Remove a collaborator from a shared list"""
        try:
            share = ListShare.objects.get(id=share_id, list__user=list_owner)
            share.shared_with.remove(user_to_remove)
            return True
        except ListShare.DoesNotExist:
            return False
    
    @staticmethod
    def get_share_analytics(user):
        """Get sharing analytics for a user"""
        user_shares = ListShare.objects.filter(list__user=user, is_active=True)
        
        total_shares = user_shares.count()
        active_shares = user_shares.filter(expires_at__gt=timezone.now()).count()
        total_collaborators = sum(share.shared_with.count() for share in user_shares)
        
        # Most shared list
        most_shared_list = None
        max_collaborators = 0
        for share in user_shares:
            collab_count = share.shared_with.count()
            if collab_count > max_collaborators:
                max_collaborators = collab_count
                most_shared_list = share.list
        
        return {
            'total_shares': total_shares,
            'active_shares': active_shares,
            'total_collaborators': total_collaborators,
            'most_shared_list': most_shared_list.name if most_shared_list else None,
            'max_collaborators': max_collaborators
        }

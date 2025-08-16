from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .models import List, ListShare
from .sharing import ListSharingService
from .serializers import ListSerializer, ListShareSerializer


class ListShareView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, list_id):
        """Create a share link for a list"""
        try:
            list_obj = get_object_or_404(List, id=list_id, user=request.user)
            permission = request.data.get('permission', 'view')
            expires_in_days = request.data.get('expires_in_days', 30)
            
            if permission not in ['view', 'edit']:
                return Response({'error': 'Invalid permission level'}, status=status.HTTP_400_BAD_REQUEST)
            
            share = ListSharingService.create_share_link(
                list_obj, request.user, permission, expires_in_days
            )
            
            share_url = f"{request.build_absolute_uri('/')[:-1]}/shared/{share.share_token}"
            
            return Response({
                'share_id': share.id,
                'share_token': share.share_token,
                'share_url': share_url,
                'permission': share.permission,
                'expires_at': share.expires_at,
                'is_active': share.is_active
            }, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Failed to create share link'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request, list_id):
        """Get all shares for a list"""
        try:
            list_obj = get_object_or_404(List, id=list_id, user=request.user)
            shares = ListShare.objects.filter(list=list_obj, is_active=True)
            
            share_data = []
            for share in shares:
                collaborators = [
                    {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                    for user in share.shared_with.all()
                ]
                
                share_data.append({
                    'id': share.id,
                    'share_token': share.share_token,
                    'share_url': f"{request.build_absolute_uri('/')[:-1]}/shared/{share.share_token}",
                    'permission': share.permission,
                    'expires_at': share.expires_at,
                    'created_at': share.created_at,
                    'collaborators': collaborators,
                    'collaborator_count': len(collaborators)
                })
            
            return Response(share_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': 'Failed to fetch shares'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, list_id, share_id):
        """Revoke a share link"""
        try:
            success = ListSharingService.revoke_share(share_id, request.user)
            if success:
                return Response({'message': 'Share revoked successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Share not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Failed to revoke share'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SharedListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, share_token):
        """Access a shared list by token"""
        try:
            share = ListSharingService.get_share_by_token(share_token)
            if not share:
                return Response({'error': 'Invalid or expired share link'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user already has access
            has_access, permission = ListSharingService.can_user_access_list(share.list, request.user)
            
            list_data = ListSerializer(share.list).data
            
            return Response({
                'list': list_data,
                'share_info': {
                    'permission': share.permission,
                    'shared_by': {
                        'username': share.shared_by.username,
                        'first_name': share.shared_by.first_name,
                        'last_name': share.shared_by.last_name
                    },
                    'expires_at': share.expires_at,
                    'has_access': has_access,
                    'user_permission': permission
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': 'Failed to access shared list'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, share_token):
        """Accept a share invitation"""
        try:
            share = ListSharingService.accept_share(share_token, request.user)
            
            return Response({
                'message': 'Share accepted successfully',
                'list': ListSerializer(share.list).data,
                'permission': share.permission
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Failed to accept share'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserSharesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all shares created by the user and shares they have access to"""
        try:
            # Shares created by user
            created_shares = ListSharingService.get_user_shares(request.user)
            created_data = []
            
            for share in created_shares:
                collaborators = [
                    {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                    for user in share.shared_with.all()
                ]
                
                created_data.append({
                    'id': share.id,
                    'list': {
                        'id': share.list.id,
                        'name': share.list.name,
                        'list_type': share.list.list_type
                    },
                    'share_token': share.share_token,
                    'share_url': f"{request.build_absolute_uri('/')[:-1]}/shared/{share.share_token}",
                    'permission': share.permission,
                    'expires_at': share.expires_at,
                    'created_at': share.created_at,
                    'collaborators': collaborators,
                    'collaborator_count': len(collaborators)
                })
            
            # Shares the user has access to
            shared_with_user = ListSharingService.get_shared_with_user(request.user)
            shared_data = []
            
            for share in shared_with_user:
                shared_data.append({
                    'id': share.id,
                    'list': {
                        'id': share.list.id,
                        'name': share.list.name,
                        'list_type': share.list.list_type
                    },
                    'shared_by': {
                        'username': share.shared_by.username,
                        'first_name': share.shared_by.first_name,
                        'last_name': share.shared_by.last_name
                    },
                    'permission': share.permission,
                    'accepted_at': share.accepted_at,
                    'expires_at': share.expires_at
                })
            
            return Response({
                'created_shares': created_data,
                'shared_with_me': shared_data,
                'analytics': ListSharingService.get_share_analytics(request.user)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': 'Failed to fetch user shares'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ShareCollaboratorsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, share_id):
        """Update collaborator permissions"""
        try:
            user_id = request.data.get('user_id')
            new_permission = request.data.get('permission')
            
            if not user_id or not new_permission:
                return Response({'error': 'user_id and permission are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if new_permission not in ['view', 'edit']:
                return Response({'error': 'Invalid permission level'}, status=status.HTTP_400_BAD_REQUEST)
            
            success = ListSharingService.update_share_permission(share_id, request.user, new_permission)
            
            if success:
                return Response({'message': 'Permission updated successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Share not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({'error': 'Failed to update permission'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, share_id):
        """Remove a collaborator from a shared list"""
        try:
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user_to_remove = get_object_or_404(User, id=user_id)
            success = ListSharingService.remove_collaborator(share_id, user_to_remove, request.user)
            
            if success:
                return Response({'message': 'Collaborator removed successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Share not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({'error': 'Failed to remove collaborator'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_list_access(request, list_id):
    """Check if user has access to a list and what permission level"""
    try:
        list_obj = get_object_or_404(List, id=list_id)
        has_access, permission = ListSharingService.can_user_access_list(list_obj, request.user)
        
        return Response({
            'has_access': has_access,
            'permission': permission,
            'list_name': list_obj.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': 'Failed to check access'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

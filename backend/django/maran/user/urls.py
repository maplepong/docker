from django.urls import path
from . import views
from . import valid
from . import auth
from . import image
from . import friend

app_name = "user"

urlpatterns = [
    path("login", views.login),
    path("otp_verify", views.otp_verify),
    path("api-login", auth.api_login),
    path("api-signup", auth.api_signup),
    path("generate_email_pin", views.generate_email_pin),
    path("verify_pin", views.verify_pin),
    path("sign-up", views.signup),
    path("valid-check", valid.duplicate_check),
    path("information", views.userinfo),
    path("change-password", views.change_password),
    path("image", image.image),
    path("api/token/refresh", auth.TokenRefreshView.as_view()),
    path("friend-list", friend.friend_list),
    path("friend/<str:nickname>", friend.friend),
    path("friend-request-list", friend.friend_request_list),
    path("friend-request/<str:nickname>", friend.friend_request),
    path("block-user", friend.block_user),
    path("unblock-user", friend.unblock_user),
    path("blocked-list", friend.get_blocked_users),
]

# notes/urls.py
from django.urls import path
from .views import (
    RegisterView,
    MyTokenObtainPairView,
    NoteListCreateView,
    NoteDetailView,
    PredictiveTextView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("notes/", NoteListCreateView.as_view(), name="note_list_create"),
    path("notes/<int:pk>/", NoteDetailView.as_view(), name="note_detail"),
    path("predict/", PredictiveTextView.as_view(), name="predictive_text"),
]

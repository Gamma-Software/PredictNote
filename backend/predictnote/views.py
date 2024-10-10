# notes/views.py
import os
from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .models import Note
from .serializers import UserSerializer, NoteSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictiveTextSerializer
from rest_framework.permissions import IsAuthenticated
import openai


# Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


# Custom Token Serializer (Optional: Add custom claims)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        token["username"] = user.username
        return token


# Custom Token View
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# Note List/Create View
class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Note Detail View
class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


class PredictiveTextView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PredictiveTextSerializer(data=request.data)
        if serializer.is_valid():
            prompt = serializer.validated_data["prompt"]
            max_tokens = serializer.validated_data.get("max_tokens", 50)
            openai.api_key = os.getenv("OPENAI_API_KEY")

            try:
                response = openai.Completion.create(
                    engine="gpt-4-1106-preview",  # Choose appropriate model
                    prompt=prompt,
                    max_tokens=max_tokens,
                    n=1,
                    stop=None,
                    temperature=0.7,
                )
                suggestion = response.choices[0].text.strip()
                return Response({"suggestion": suggestion}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

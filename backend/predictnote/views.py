# notes/views.py
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
            message = serializer.validated_data["prompt"]
            max_tokens = serializer.validated_data.get("max_tokens", 50)

            try:
                import os

                from langchain_core.output_parsers import StrOutputParser
                from langchain_core.prompts import ChatPromptTemplate
                from langchain_openai import ChatOpenAI

                model = ChatOpenAI(model="gpt-4o-mini")

                prompt = ChatPromptTemplate.from_template(
                    "Continue the next sentence in the same language (output only the continuation): {text}"
                )

                chain = prompt | model | StrOutputParser()
                result = chain.invoke({"text": message})
                return Response(
                    {"suggestion": result.strip()}, status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

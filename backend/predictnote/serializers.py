# notes/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"], password=validated_data["password"]
        )
        return user


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "title", "content", "user")
        read_only_fields = ("user",)


# notes/serializers.py
class PredictiveTextSerializer(serializers.Serializer):
    prompt = serializers.CharField()
    max_tokens = serializers.IntegerField(default=50, required=False)

# notes/models.py
from django.db import models
from django.contrib.auth.models import User


class Note(models.Model):
    title = models.CharField(max_length=120)
    content = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, related_name="notes", on_delete=models.CASCADE)

    def __str__(self):
        return self.title

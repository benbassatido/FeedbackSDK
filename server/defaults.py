DEFAULT_COLORS = {
    "background": "#F4F5FB",
    "card": "#FFFFFF",
    "title": "#15172B",
    "button": "#4F46E5",
}

DEFAULT_FORM_TITLE = "Send Feedback"
DEFAULT_FORM_DESCRIPTION = "We'd love to hear from you. Please fill out the form below."

DEFAULT_FORM_FIELDS = [
    {
        "fieldId": "feedback_type",
        "type": "dropdown",
        "label": "Feedback Type",
        "required": True,
        "order": 1,
        "options": ["Bug", "Feature Request", "General", "Other"],
        "maxLength": None,
    },
    {
        "fieldId": "rating",
        "type": "rating",
        "label": "Rating",
        "required": True,
        "order": 2,
        "options": None,
        "maxLength": None,
    },
    {
        "fieldId": "message",
        "type": "text",
        "label": "Message",
        "required": True,
        "order": 3,
        "options": None,
        "maxLength": 500,
    },
]

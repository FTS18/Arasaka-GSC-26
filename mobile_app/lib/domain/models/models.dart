class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool onboarded;
  final String language;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.onboarded,
    required this.language,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      onboarded: json['onboarded'] == true,
      language: json['language']?.toString() ?? 'en',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'onboarded': onboarded,
    'language': language,
  };
}

class Need {
  final String id;
  final String title;
  final String description;
  final String category;
  final String status;
  final int urgency;
  final Map<String, double> location;

  Need({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.status,
    required this.urgency,
    required this.location,
  });

  factory Need.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>? ?? {};
    return Need(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'other',
      status: json['status']?.toString() ?? 'pending',
      urgency: (json['urgency'] as num?)?.toInt() ?? 1,
      location: {
        'lat': (loc['lat'] as num?)?.toDouble() ?? 0.0,
        'lng': (loc['lng'] as num?)?.toDouble() ?? 0.0,
      },
    );
  }
}


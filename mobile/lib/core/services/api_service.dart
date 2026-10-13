import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<http.Response> post(String url, Map<String, dynamic> body) async {
    final headers = await _headers();
    return http.post(
      Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
    );
  }

  static Future<http.Response> get(String url) async {
    final headers = await _headers();
    return http.get(Uri.parse(url), headers: headers);
  }

  static Future<http.Response> patch(String url, Map<String, dynamic> body) async {
    final headers = await _headers();
    return http.patch(
      Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
    );
  }
}

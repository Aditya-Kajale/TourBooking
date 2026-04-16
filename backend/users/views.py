from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as django_login
from django.middleware.csrf import get_token
from django.contrib.auth import logout as django_logout
import json
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from rest_framework.authtoken.models import Token


def me(request):
	user = request.user
	if user and user.is_authenticated:
		return JsonResponse({
			'id': str(user.id),
			'username': user.username,
			'email': user.email,
			'is_guide': getattr(user, 'is_guide', False),
		})
	return JsonResponse({'detail': 'Not authenticated'}, status=401)


@csrf_exempt
def login_view(request):
	# Simple JSON login endpoint for local dev
	if request.method != 'POST':
		return JsonResponse({'detail': 'Method not allowed'}, status=405)
	# accept JSON or form data
	try:
		data = json.loads(request.body.decode('utf-8')) if request.body else {}
	except Exception:
		data = {}

	# merge with POST for form-encoded bodies
	if hasattr(request, 'POST'):
		for k, v in request.POST.items():
			if k not in data:
				data[k] = v

	username = data.get('username')
	password = data.get('password')

	if not username or not password:
		return JsonResponse({'detail': 'username and password required'}, status=400)

	# authenticate
	user = authenticate(request, username=username, password=password)
	if user is not None:
		django_login(request, user)
		# ensure CSRF cookie is set for subsequent requests
		csrftoken = get_token(request)
		token, _ = Token.objects.get_or_create(user=user)
		resp = JsonResponse({
			'id': str(user.id),
			'username': user.username,
			'email': user.email,
			'is_guide': getattr(user, 'is_guide', False),
			'csrfToken': csrftoken,
			'token': token.key,
		})
		# Also set cookie for best-effort; some dev setups block cross-port cookies
		resp.set_cookie('csrftoken', csrftoken)
		return resp

	# helpful debug: indicate whether the username exists
	from django.contrib.auth import get_user_model
	User = get_user_model()
	try:
		exists = User.objects.filter(username=username).exists()
	except Exception:
		exists = False

	if not exists:
		return JsonResponse({'detail': 'User not found'}, status=404)

	return JsonResponse({'detail': 'Invalid credentials'}, status=401)


@csrf_exempt
@require_POST
def register_view(request):
	# Simple JSON register endpoint for local dev
	try:
		data = json.loads(request.body.decode('utf-8')) if request.body else {}
	except Exception:
		data = {}

	username = data.get('username')
	password = data.get('password')
	email = data.get('email', '')
	is_guide = bool(data.get('is_guide', False))

	if not username or not password:
		return JsonResponse({'detail': 'username and password required'}, status=400)

	User = get_user_model()
	if User.objects.filter(username=username).exists():
		return JsonResponse({'detail': 'username already exists'}, status=400)

	user = User.objects.create_user(username=username, email=email, password=password)
	user.is_guide = is_guide
	user.save()

	# return CSRF token and Auth Token in response for convenience in dev setups
	csrftoken = get_token(request)
	token, _ = Token.objects.get_or_create(user=user)
	resp = JsonResponse({
		'id': str(user.id), 
		'username': user.username, 
		'email': user.email, 
		'is_guide': user.is_guide, 
		'csrfToken': csrftoken,
		'token': token.key
	}, status=201)
	resp.set_cookie('csrftoken', csrftoken)
	return resp


@csrf_exempt
def logout_view(request):
	# Simple logout endpoint for local dev
	if request.method not in ('POST', 'GET'):
		return JsonResponse({'detail': 'Method not allowed'}, status=405)
	try:
		django_logout(request)
	except Exception:
		pass
	return JsonResponse({'detail': 'logged out'})

def login_user(email, password):

    user = User.query.filter_by(email=email).first()

    if not user:
        return None

    if user.failed_attempts >= 5:
        return "ACCOUNT_LOCKED"

    if not check_password_hash(user.password, password):

        user.failed_attempts += 1
        db.session.commit()

        return None

    user.failed_attempts = 0
    db.session.commit()

    return user
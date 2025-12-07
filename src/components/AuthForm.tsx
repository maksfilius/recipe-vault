interface AuthFormProps {
  type: 'login' | 'register'
}

export default function AuthForm({type}: AuthFormProps) {
  return (
    <>
      {type == "login" && (
        <p>Login page</p>
      )}
      {type == "register" && (
        <p>Register page</p>
      )}
    </>
  )
}

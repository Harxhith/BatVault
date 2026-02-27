
import { AuthForm } from "@/components/AuthForm";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-batman bat-grad-bg">
      <AuthForm isLogin={true} />
    </div>
  );
};

export default Login;

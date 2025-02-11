import React, { useEffect } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../../context/useAuth";
import { useForm } from "react-hook-form";

type Props = {};

type LoginFormsInputs = {
  userName: string;
  password: string;
};

const validation = Yup.object().shape({
  userName: Yup.string().required("Username is required."),
  password: Yup.string().required("Password is required."),
});

const LoginPage = (props: Props) => {
  const { loginUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormsInputs>({
    resolver: yupResolver(validation),
  });

  // Inject the Google Fonts link only on the login page
  useEffect(() => {
    const link = document.createElement("link");

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleLogin = (form: LoginFormsInputs) => {
    loginUser(form.userName, form.password);
  };

  return (
    <section className="bg-light">
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow-sm w-100" style={{ maxWidth: "400px" }}>
          <div className="card-body">
            <h1 className="card-title text-center mb-4">
              Sign in to your account
            </h1>
            <form onSubmit={handleSubmit(handleLogin)}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Username"
                  {...register("userName")}
                />
                {errors.userName && (
                  <p className="text-danger">{errors.userName.message}</p>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-danger">{errors.password.message}</p>
                )}
              </div>
              <div className="d-flex justify-content-between mb-3">
                <a href="#" className="small">
                  Forgot password?
                </a>
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Sign in
              </button>
              <p className="mt-3 small text-center">
                Don’t have an account yet?{" "}
                <a href="#" className="text-decoration-underline">
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;

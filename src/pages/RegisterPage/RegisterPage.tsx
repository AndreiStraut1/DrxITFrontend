import React, { useEffect } from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../../context/useAuth";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

type Props = {};

type RegisterFormsInputs = {
  email: string;
  userName: string;
  password: string;
};

const validation = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  userName: Yup.string().required("Username is required."),
  password: Yup.string().required("Password is required."),
});

const RegisterPage = (props: Props) => {
  const { registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormsInputs>({
    resolver: yupResolver(validation),
  });

  const handleRegister = (form: RegisterFormsInputs) => {
    registerUser(form.email, form.userName, form.password);
  };

  return (
    <section className="bg-light">
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow-sm w-100" style={{ maxWidth: "400px" }}>
          <div className="card-body">
            <h1 className="card-title text-center mb-4">Create an account</h1>
            <form onSubmit={handleSubmit(handleRegister)}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  className="form-control"
                  placeholder="Email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-danger">{errors.email.message}</p>
                )}
              </div>
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
              <button type="submit" className="btn btn-primary w-100">
                Sign up
              </button>
              <p className="mt-3 small text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;

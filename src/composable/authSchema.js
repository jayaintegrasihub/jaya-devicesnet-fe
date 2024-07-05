import * as yup from 'yup'

export const loginSchema = yup.object({
  username: yup.string().required().label(' '),
  password: yup.string().required().min(8).label(' '), 
})

export const createUserSchema = yup.object({
  username: yup.string().required().label('Username'),
  email: yup.string().required().email().label('Email Address'),
  password: yup.string().required().min(8).label('Password'), 
  passwordConfirmation: yup.string().required()
    .oneOf([yup.ref('password'), null], 'Passwords must match').label('Password Confirmation'),
  // role: yup.string().required().oneOf(['ADMIN', 'USER'], 'Role must be "ADMIN" or "USER"').label('Role'),
  // contractorId: yup.string().required().label('Contractor'),
});

export const updatePasswordSchema = yup.object({
  password: yup.string().required().min(8), 
  passwordConfirmation: yup.string()
}); 
import { Alert, App, Button, DatePicker, Form, Input, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { cadastrar } from "../../api/authApi.js";
import { tratarErroApi } from "../../utils/tratarErroApi.js";

export function Cadastro() {
    const [enviando, setEnviando] = useState(false);
    const [mensagemErro, setMensagemErro] = useState(null);
    const navigate = useNavigate();
    const { message } = App.useApp();

    async function aoEnviar(valores) {
        setMensagemErro(null);
        setEnviando(true);
        try {
            const dados = {
                nome: valores.name,
                dataNascimento: valores.dataNascimento.format("YYYY-MM-DD"),
                email: valores.email,
                senha: valores.senha,
                confirmarSenha: valores.confirmarSenha,
            }
            await cadastrar(dados);
            message.success("Cadastro realizado com sucesso! Faça login para continuar.");
            navigate("/login");
        } catch (erro) {
            setMensagemErro(tratarErroApi(erro));
        } finally {
            setEnviando(false);
        }

    }
    return (
        <div>
            <Typography.Title level={3}>CaféGestão</Typography.Title>
            <Typography.Text type="secondary">
                Crie sua conta para começar a gerenciar sua propriedade rural
            </Typography.Text>

            {mensagemErro && (
                <Alert
                    type="error"
                    showIcon
                    message={mensagemErro}
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form
                layout="vertical"
                onFinish={aoEnviar}
                onValuesChange={() => setMensagemErro(null)}
            >
                <Form.Item
                    name="name"
                    label="Nome completo"
                    rules={[
                        { required: true, message: "Informe o nome completo." },
                        { max: 100, message: "O nome deve ter no máximo 100 caracteres." },
                    ]}
                >
                    <Input autoFocus autoComplete="name" />
                </Form.Item>

                <Form.Item
                    name="dataNascimento"
                    label="Data de nascimento"
                    rules={[
                        { required: true, message: "Informe a data de nascimento." },
                    ]}
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                        disabledDate={(dia) => dia && dia > dayjs().endOf("day")}
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="E-mail"
                    rules={[
                        { required: true, message: "Informe o e-mail." },
                        { type: "email", message: "E-mail inválido." },
                        { max: 150, message: "O e-mail deve ter no máximo 150 caracteres." },
                    ]}
                >
                    <Input autoComplete="email" />
                </Form.Item>

                <Form.Item
                    name="senha"
                    label="Senha"
                    rules={[
                        { required: true, message: "Informe a senha." },
                        { min: 8, message: "A senha deve ter no mínimo 8 caracteres." },
                        { max: 100, message: "A senha deve ter no máximo 100 caracteres." },
                        {
                            pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                            message: "A senha deve conter letras e números.",
                        },
                    ]}
                >
                    <Input.Password
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                    />
                </Form.Item>

                <Form.Item
                    name="confirmarSenha"
                    label="Confirmar senha"
                    dependencies={["senha"]}
                    rules={[
                        { required: true, message: "Confirme a senha." },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("senha") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("As senhas não coincidem."));
                            },
                        }),
                    ]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={enviando}
                    >
                        Criar conta
                    </Button>
                </Form.Item>
            </Form>

            <Link to="/login">Já tenho conta — Entrar</Link>
        </div>
    );
}
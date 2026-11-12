function caminhoDoCampo(chave) {
  return chave
    .split(/[.[\]]/)
    .filter(Boolean)
    .map((parte) => (/^\d+$/.test(parte) ? Number(parte) : parte.charAt(0).toLowerCase() + parte.slice(1)));
}

function campoExiste(form, caminho) {
  return form.getFieldInstance(caminho) !== undefined;
}

export function aplicarErrosNoFormulario(form, erro) {
  const status = erro.response?.status;
  const dados = erro.response?.data;

  if (status === 409 && dados?.campo) {
    const caminho = caminhoDoCampo(dados.campo);
    if (!campoExiste(form, caminho)) return false;

    form.setFields([{ name: caminho, errors: [dados.mensagem] }]);
    return true;
  }

  if (status === 400 && dados?.errors) {
    const entradas = Object.entries(dados.errors);
    const campos = entradas
      .map(([chave, mensagens]) => ({ name: caminhoDoCampo(chave), errors: mensagens }))
      .filter((campo) => campoExiste(form, campo.name));

    if (campos.length === 0) return false;

    form.setFields(campos);
    return campos.length === entradas.length;
  }

  return false;
}
import { Col, Form, Input, Row, Select } from 'antd';
import { mascararCep, REGEX_CEP } from '../utils/mascaras.js';
import { OPCOES_UF } from '../utils/ufs.js';

const EXEMPLOS_PADRAO = {
  cidade: 'Ex.: Cacoal',
  rua: 'Ex.: Avenida Porto Velho',
  numero: 'Ex.: 1250 ou S/N',
  bairro: 'Ex.: Centro',
  complemento: 'Ex.: Sala 2, próximo à rodoviária',
};

export function CamposEndereco({ exemplos = EXEMPLOS_PADRAO }) {
  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name={['endereco', 'cep']}
            label="CEP"
            normalize={mascararCep}
            rules={[
              { required: true, message: 'Informe o CEP.' },
              { pattern: REGEX_CEP, message: 'Informe o CEP no formato 00000-000.' },
            ]}
          >
            <Input placeholder="00000-000" inputMode="numeric" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={6}>
          <Form.Item name={['endereco', 'uf']} label="Estado (UF)" rules={[{ required: true, message: 'Selecione a UF.' }]}>
            <Select options={OPCOES_UF} placeholder="UF" showSearch />
          </Form.Item>
        </Col>

        <Col xs={24} sm={10}>
          <Form.Item
            name={['endereco', 'cidade']}
            label="Cidade"
            rules={[
              { required: true, whitespace: true, message: 'Informe a cidade.' },
              { max: 100, message: 'A cidade deve ter no máximo 100 caracteres.' },
            ]}
          >
            <Input placeholder={exemplos.cidade} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={16}>
          <Form.Item
            name={['endereco', 'rua']}
            label="Rua"
            rules={[
              { required: true, whitespace: true, message: 'Informe a rua.' },
              { max: 150, message: 'A rua deve ter no máximo 150 caracteres.' },
            ]}
          >
            <Input placeholder={exemplos.rua} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={8}>
          <Form.Item
            name={['endereco', 'numero']}
            label="Número"
            rules={[
              { required: true, whitespace: true, message: 'Informe o número (use S/N se não houver).' },
              { max: 10, message: 'O número deve ter no máximo 10 caracteres.' },
            ]}
          >
            <Input placeholder={exemplos.numero} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name={['endereco', 'bairro']}
            label="Bairro"
            rules={[
              { required: true, whitespace: true, message: 'Informe o bairro.' },
              { max: 50, message: 'O bairro deve ter no máximo 50 caracteres.' },
            ]}
          >
            <Input placeholder={exemplos.bairro} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name={['endereco', 'pais']}
            label="País"
            rules={[{ max: 50, message: 'O país deve ter no máximo 50 caracteres.' }]}
          >
            <Input placeholder="Brasil" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name={['endereco', 'complemento']}
        label="Complemento (opcional)"
        rules={[{ max: 100, message: 'O complemento deve ter no máximo 100 caracteres.' }]}
      >
        <Input placeholder={exemplos.complemento} />
      </Form.Item>
    </>
  );
}

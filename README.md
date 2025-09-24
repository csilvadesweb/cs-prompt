# ⚡ Biblioteca de Prompts — cs-prompt

[![Abrir no GitHub Pages](https://img.shields.io/badge/Acessar%20Site-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://csilvadesweb.github.io/cs-prompt/)

> Uma biblioteca completa de prompts, organizada por **Persona**, **Tema** e **Tipo de Post**, com busca inteligente, favoritos e modo escuro/claro — tudo 100% no navegador.

---

## ✨ Funcionalidades

- 🌗 **Modo claro/escuro** com persistência  
- 🔍 **Busca inteligente** com realce de termos  
- ⭐ **Favoritos** salvos no navegador  
- 🏷️ **Tags clicáveis** e sugestões de prompts similares  
- ⤵️ **Importar / ⤴️ Exportar** biblioteca (JSON)  
- 🔄 **Gerador de prompts aleatórios** (até 1000 de uma vez)  
- 🧹 **Limpar biblioteca** (sessão atual)  
- 📱 **Design responsivo**, funciona em desktop e mobile  
- 🚀 Carregamento automático do arquivo `prompts_5000.json` (5.000 prompts prontos para uso)  

---

## 🖼️ Captura de Tela

![Screenshot](https://raw.githubusercontent.com/csilvadesweb/cs-prompt/main/screenshot.png)

*(Adicione um print do site no repositório com o nome `screenshot.png` para que apareça aqui)*

---

## 📦 Como Usar

1. **Acesse o site:**  
   [https://csilvadesweb.github.io/cs-prompt/](https://csilvadesweb.github.io/cs-prompt/)

2. **Importe seus próprios prompts (opcional):**  
   Clique em **Importar**, selecione um arquivo `.json` no formato:
   ```jsonc
   [
     {
       "id": 1,
       "titulo": "Título do Prompt",
       "persona": "Social Media",
       "tema": "Marketing",
       "tipo": "Post",
       "tags": ["marketing", "social"],
       "prompt": "Escreva um post..."
     }
   ]

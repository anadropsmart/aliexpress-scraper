const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

// Página inicial (pra testar se tá funcionando)
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Funcionando!',
    mensagem: 'Servidor AliExpress no ar!' 
  });
});

// Rota principal - extrai dados do AliExpress
app.post('/extrair', async (req, res) => {
  const { url } = req.body;
  
  // Verificar se enviou a URL
  if (!url) {
    return res.status(400).json({ 
      erro: 'Você precisa enviar a URL do produto AliExpress!' 
    });
  }

  console.log('🔗 URL recebida:', url);
  
  let navegador;
  
  try {
    console.log('🌐 Abrindo navegador...');
    
    // Abrir navegador (como se fosse Chrome invisível)
    navegador = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const pagina = await navegador.newPage();
    
    // Fingir que é pessoa navegando (pra AliExpress não bloquear)
    console.log('👤 Configurando navegador como pessoa real...');
    await pagina.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0');
    await pagina.setViewport({ width: 1920, height: 1080 });
    
    // Acessar a página do produto
    console.log('📄 Carregando página do AliExpress...');
    await pagina.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Esperar JavaScript carregar (5 segundos)
    console.log('⏳ Esperando dados carregarem...');
    await pagina.waitForTimeout(5000);

    // EXTRAIR DADOS DA PÁGINA
    console.log('🔍 Extraindo informações do produto...');
    const dadosProduto = await pagina.evaluate(() => {
      // Verificar se os dados existem
      if (!window.runParams || !window.runParams.data) {
        return { erro: 'Dados não encontrados na página' };
      }

      const dados = window.runParams.data;
      
      // Pegar informações importantes
      return {
        // Básico
        id: dados.productId || '',
        titulo: dados.titleModule?.subject || 'Sem título',
        
        // Preço
        preco: dados.priceModule?.minActivityAmount?.value || 
               dados.priceModule?.minAmount?.value || 0,
        moeda: dados.priceModule?.minActivityAmount?.currency || 'USD',
        
        // Imagens (todas as fotos do produto)
        imagens: dados.imageModule?.imagePathList || [],
        
        // URL da descrição completa
        url_descricao: dados.descriptionModule?.descriptionUrl || '',
        
        // Variantes (cores, tamanhos, etc)
        variacoes: (dados.skuModule?.productSKUPropertyList || []).map(variacao => ({
          tipo: variacao.skuPropertyName,
          opcoes: variacao.skuPropertyValues.map(opcao => ({
            id: opcao.propertyValueId,
            nome: opcao.propertyValueName,
            foto: opcao.skuPropertyImagePath
          }))
        })),
        
        // Especificações técnicas
        especificacoes: (dados.specsModule?.props || []).map(spec => ({
          nome: spec.attrName,
          valor: spec.attrValue
        })),
        
        // Avaliações
        nota: dados.titleModule?.feedbackRating?.averageStar || 0,
        total_avaliacoes: dados.titleModule?.feedbackRating?.totalValidNum || 0,
        
        // Loja
        loja: {
          nome: dados.storeModule?.storeName || '',
          url: dados.storeModule?.storeURL || ''
        }
      };
    });

    // Fechar navegador
    await navegador.close();
    console.log('✅ Dados extraídos com sucesso!');

    // Enviar dados de volta
    res.json({
      sucesso: true,
      dados: dadosProduto
    });

  } catch (erro) {
    console.error('❌ ERRO:', erro.message);
    
    if (navegador) {
      await navegador.close();
    }
    
    res.status(500).json({
      sucesso: false,
      erro: erro.message
    });
  }
});

// Iniciar servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando! Pronto para extrair produtos.`);
});
```

4. **Clique** em **"Commit new file"**

✅ **Segundo arquivo criado!** Esse é o mais importante.

---

### Passo 2.4: Criar Arquivo 3 (Procfile)

**O que é isso?** É um "manual de instruções" pro Railway saber como ligar nosso servidor.

1. **Add file** → **Create new file**
2. **Nome:** `Procfile` (exatamente assim, com P maiúsculo, SEM extensão tipo .txt)
3. **Cole** apenas esta linha:
```
web: node server.js

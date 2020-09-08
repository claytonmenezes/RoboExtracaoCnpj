import {Builder, By, Key, until} from 'selenium-webdriver'
import sqlite3 from 'sqlite3'

let driver = null
let db = new sqlite3.Database('dbCnpj.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Conectado em dbCnpj.');
})

export default {
  async start () {
    if (await this.abrePagina()) {
      console.log('Página carregada')
      await this.filtraCnpj()
      await this.auxiliar()
      console.log('------------------------------------------------------------------------------------------------------')
    }
    await this.fechaPagina()
    await db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Desconectado dbCnpj.');
    })
    return
  },
  async auxiliar () {
    try {
      await this.esperaElementoExistir('/html/body/div[2]/div[2]/div/mat-dialog-container')
      await this.pegaCnpjPagina(await driver.findElements(By.xpath('//*[@id="content"]/corretores-pequisa/section/div/div/div/div/div/table/tbody/tr')))
      await this.proximaPagina()
      await this.auxiliar()
    } catch (error) {
      console.log(error)
    }
  },
  async proximaPagina () {
    await driver.findElement(By.xpath('//*[@id="content"]/corretores-pequisa/section/div/div/div/div/div/div/div/nav[2]/ul/li[4]')).click()
  },
  async abrePagina () {
    console.log('Carregando o WebDriver e carregando a página')
    try {
      driver = await new Builder().forBrowser('chrome').usingServer('http://localhost:8090/wd/hub').build()
      await driver.get('https://www2.susep.gov.br/safe/Corretores/pesquisa')
      return true
    } catch {
      console.log('Erro ao abrir o navegador e carregar a página verificar o Server Selenium')
      return false
    }
  },
  async fechaPagina () {
    console.log('Fechando a Pagina e zerando o WebDriver')
    await driver.quit();
    driver = null
  },
  async verificaPaginaOk () {
    if(await this.verificaElementoExiste('//*[@id="tipoPessoa"]')) {
      return true
    } else {
      return false
    }
  },
  async filtraCnpj () {
    if (await this.verificaPaginaOk()) {
      try {
        await driver.findElement(By.xpath('//*[@id="tipoPessoa"]')).click()
        await driver.findElement(By.xpath('//*[@id="tipoPessoa"]/option[3]')).click()
        await driver.findElement(By.xpath('//*[@id="produtos"]')).click()
        await driver.findElement(By.xpath('//*[@id="produtos"]/option[6]')).click()
        await driver.findElement(By.xpath('//*[@id="situacao"]')).click()
        await driver.findElement(By.xpath('//*[@id="situacao"]/option[2]')).click()
        await driver.findElement(By.xpath('//*[@id="recadastrado"]')).click()
        await driver.findElement(By.xpath('//*[@id="recadastrado"]/option[2]')).click()
        await driver.findElement(By.xpath('//*[@id="content"]/corretores-pequisa/section/div/form/div/div/button')).click()
      } catch {
        console.log('erro')
      }
    }
  },
  async pegaCnpjPagina (trs) {
    for (let tr of trs) {
      let tds = await tr.findElements(By.tagName('TD'))
      if (tds.length) {
        let cnpj = await tds[2].getText()
        if (!cnpj.includes('***')) {
          await this.inserirCnpj(cnpj)
          console.log(cnpj)
        }
      }
    }
  },
  async limpaInput (xpath) {
    await driver.findElement(By.xpath(xpath)).clear()
  },
  async atualizarPagina () {
    await driver.navigate().refresh()
  },
  async esperaElementoExistir (xpath) {
    if (await this.verificaElementoExiste(xpath)) {
      await this.esperaElementoExistir(xpath)
    }
  },
  async verificaElementoExiste (xpath) {
    return await driver.findElements(By.xpath(xpath)).then((els) => {
      if (els.length > 0) {
        return true
      }
      return false
    })
  },
  async inserirCnpj (cnpj) {
    await db.run('CREATE TABLE IF NOT EXISTS Cnpj(numero text)')
    await db.run(`INSERT INTO Cnpj(numero) VALUES(?)`, [cnpj], function(err) {
      if (err) {
        return console.log(err.message)
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    })
  }
}
import React from 'react';
import Web3 from 'web3';
import './App.css';
import Navbar from './Navbar';
import Marketplace from '../abis/Marketplace.json';
import Main from './Main';

async function loadWeb3() {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum)
    await window.ethereum.enable()
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider)
  } else {
    window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
  }
}

async function loadBlockchainData() {
  const web3 = window.web3
  const accounts = await web3.eth.getAccounts()

  const networkId = await web3.eth.net.getId()
  const networkData = await Marketplace.networks[networkId]
  if (networkData) {
    const marketplace = web3.eth.Contract(Marketplace.abi, networkData.address)
    const productCount = await marketplace.methods.productCount().call()
    const products = []
    for (let i = 1; i <= productCount; i++) {
      products.push(await marketplace.methods.products(i).call())
    }
    return { marketplace, accounts, productCount, products }
  } else {
    throw new Error('Marketplace contract not deployed to detected network.')
  }
}

export default function App() {
  const [account, setAccount] = React.useState('')
  const [productCount, setProductCount] = React.useState(0)
  const [products, setProducts] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [marketplace, setMarketplace] = React.useState()
  React.useEffect(() => {
    loadWeb3().then(() => {
      loadBlockchainData().then(({ accounts, marketplace, productCount, products }) => {
        setAccount(accounts[0])
        setMarketplace(marketplace)
        setProductCount(productCount)
        setProducts(products)
        setLoading(false)
      })
    })
  }, [])

  function createProduct(name, price) {
    setLoading(true)
    marketplace.methods.createProduct(name, price).send({ from: account }).then(() => {
      // TODO: This structure does not work; and neither does the one in the tutorial.
      setLoading(false)
    })
  }

  function purchaseProduct(id, price) {
    setLoading(true)
    marketplace.methods.purchaseProduct(id).send({ from: account, value: price }).then(() => {
      // TODO: This structure does not work; and neither does the one in the tutorial.
      setLoading(false)
    })
  }

  return (
    <div>
      <Navbar account={account} />
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 d-flex text-center">
            {loading ? <div id="loader" className="test-center"><p className="text-center">Loading...</p></div>
              : <Main createProduct={createProduct} purchaseProduct={purchaseProduct} products={products} />}
          </main>
        </div>
      </div>
    </div>
  );
}

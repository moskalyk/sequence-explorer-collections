import React from 'react';
import './App.css';
import {ethers} from 'ethers'
import { sequence } from '0xsequence'
import { SequenceIndexerClient } from '@0xsequence/indexer'

import { 
  SearchInput,
  RadioGroup,
  Text, 
  Box, 
  IconButton, 
  SunIcon, 
  Placeholder,
  Tag,
  Tooltip,
  useTheme } from '@0xsequence/design-system'

const NFT = (props: any) => {
  const { theme } = useTheme()
  return(<>
  <div className={`nft-row`}>
    <div className={theme == 'dark' ? `nft-card` : `nft-card-light`}>
      <img width={100} src={props.image} />
        <br/>
        {props.name}
        <br/>
        {"x"+props.quantity}
    </div>
  </div>
  </>)
}

const fullIndexerBalancePagination = async (indexer: any, address: string) => {
  const txs: any = []

  // query Sequence Indexer for all token balance on network
  let txHistory = await indexer.getTokenBalances({
      accountAddress: address,
      includeMetadata: true
  })

  txs.push(...txHistory.balances)

  // if there are more transactions to log, proceed to paginate
  while(txHistory.page.more){  
      txHistory = await indexer.getTokenBalances({
          accountAddress: address,
          includeMetadata: true,
          page: { 
              pageSize: 10, 
              // use the after cursor from the previous indexer call
              after: txHistory!.page!.after! 
          }
      })
      txs.push(...txHistory.balances)
  }

  console.log(txs)
  return txs
}

const Collections = (props: any) => {
  const {theme, setTheme} = useTheme()

  async function getNFTs(address: any, network?: any) {
    try {

      let accountAddress = address

      console.log(props.network)
      const nfts: any = []
      let indexer;

      if(network == 'mainnet'){
        console.log('connecting to mainnet')
        indexer = new SequenceIndexerClient('https://mainnet-indexer.sequence.app')
        sequence.initWallet('mainnet')
      } else if(network == 'polygon'){
        console.log('connecting to polygon')
        indexer = new SequenceIndexerClient('https://polygon-indexer.sequence.app')
        sequence.initWallet('polygon')
      } else if(network == 'mumbai'){
        console.log('connecting to mumbai')
        indexer = new SequenceIndexerClient('https://mumbai-indexer.sequence.app')
        sequence.initWallet('mumbai')
      }

      const balances = await fullIndexerBalancePagination(indexer, accountAddress)

      balances.map((nft: any) => {
        if((nft.contractType == 'ERC1155' || nft.contractType == 'ERC721') && nft.tokenMetadata && nft.tokenMetadata.image){
          console.log('NFT')
          nfts.push({ 
            image: nft.tokenMetadata.image, 
            name: nft.tokenMetadata.name, 
            contractAddress: nft.contractAddress, 
            quantity: nft.balance
          })
        }else {
          console.log('else')
        } 
      })

      return {success: true, NFTs: nfts}
    } catch(e){
      console.log(e)
      return {success: false, error: e, NFTs: []}
    }
  }

  const onChangeInput = async (text: any, network?: any) => {
    props.setLoading(true)

    setTimeout(async () => {
      const nfts = await getNFTs(text, network)
      const nftsComponents = []
        
        for(let i = 0; i < nfts.NFTs.length; i++)
          nftsComponents.push(<NFT theme={theme} image={nfts.NFTs[i].image} name={nfts.NFTs[i].name} contractAddress={nfts.NFTs[i].contractAddress} quantity={nfts.NFTs[i].quantity}/>)
        
      props.setNFTs(nftsComponents)
      props.setLoading(false)
    }, 1000)
  }

  return(<>
    <Box justifyContent={'center'}>
      <br/>
      <Tooltip message={'predefined search'}>
        <Tag onClick={() => {props.setNFTs([]);props.setNetwork('polygon');onChangeInput('0x450cB9fbB2D44d166AACA1f6cDb1dBd9Ff168e4C', 'polygon')}}style={{cursor: 'pointer'}} label="0x450c..." gap='10'/>
      </Tooltip>
      &nbsp;&nbsp;
      <Tooltip message={'predefined search'}>
        <Tag  onClick={() => {props.setNFTs([]);props.setNetwork('mumbai');onChangeInput('0xF307B8B47725896EF4DEd1a3b65243B969db7489', 'mumbai')}} style={{cursor: 'pointer'}} label="0xf307b..." gap='4'/>
      </Tooltip>
    </Box>
    <br/>
    <Box justifyContent={'center'} width="full">
      <SearchInput value={props.searchQuery} style={{border: 'none', color: theme == 'dark'? 'white' : 'black'}} label="" labelLocation="top" onChange={(e: any) => { props.setNFTs([]); props.setSearchQuery(e.target.value);onChangeInput(e.target.value, props.network) }}/>
    </Box>
  </>)
}

const Explorer = () => {
  const {theme, setTheme} = useTheme()
  const [isSearching, setIsSearching] = React.useState<any>(false)
  const [loading, setLoading] = React.useState<any>(false)
  const [NFTs, setNFTs] = React.useState<any>([])
  const [searchQuery, setSearchQuery] = React.useState<any>('')
  const [network, setNetwork] = React.useState('polygon')

  return (
    <div>
      <br/>
      <Box justifyContent='center'>
        <RadioGroup size='lg' gap='10' flexDirection="row" value={network} onValueChange={(value) => {setSearchQuery('');setNFTs([]);setNetwork(value)}}name="network" options={[{'label': "mainnet", value: 'mainnet'},{'label': "polygon", value: 'polygon'},{'label': "mumbai", value: 'mumbai'},]}/>
      </Box>
      <br/>
      <Box>
        <Collections 
          network={network}
          setNFTs={setNFTs} 
          setLoading={setLoading}
          setIsSearching={setIsSearching}
          setNetwork={setNetwork}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>
      <br/>
      {
        NFTs.length > 0 
        ? <>
            <Text>displaying {NFTs.length}</Text>
            <br/><br/>
          </>
        : null
      }
      <br/>
      <br/>
      {
        loading ? 
        <Box justifyContent={'center'}>
          <Box flexDirection="column" gap="2">
            <Placeholder size="md" />
            <br/>
            <Placeholder size="md" />
          </Box>
        </Box> : NFTs.length > 0 ?  <div className="grid-container">{NFTs}</div> : !isSearching ? <Text>Nothing to show</Text> : null
      } 
    </div>
  );
};

function App() {

  const {theme, setTheme} = useTheme()

  return (
    <div className="App">
      <Box gap='6'>
        <IconButton style={{position: 'fixed', top: '20px', right: '20px'}} icon={SunIcon} onClick={() => {
          setTheme(theme == 'dark' ? 'light' : 'dark')
        }}/>
      </Box>
      <br/>
      <br/>
      { 
        theme == 'dark' 
        ? 
          <img className="center" src="https://docs.sequence.xyz/img/icons/sequence-composite-dark.svg" />
        :
          <img className='center' src="https://docs.sequence.xyz/img/icons/sequence-composite-light.svg"/> 
      }
      <br/>
      <br/>
      <Text variant="large">collections</Text>
      <br/>
      <br/>
      <Text variant="small">explore any wallet address to view their collections</Text>
      <br/>
      <br/>
      <Explorer/>
    </div>
  )
}

export default App;
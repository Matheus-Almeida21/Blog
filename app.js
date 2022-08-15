//Carregando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const mongoose = require('mongoose')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./routes/usuario')
const passport = require('passport')
require('./config/auth')(passport)

//Configurações
app.use(express.urlencoded({extended: true}))
app.use(express.json());

app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

mongoose.connect('mongodb://localhost/blogapp').then(()=>{
  console.log('conectado ao mongo')
}).catch((err)=>{
  console.log('Erro ao se conectar : '+err)
})

app.use(session({
  secret: 'cursodenode',
  resave: true,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

//Middleware
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null;

  next()
})

//Public - trabalhando com arquivos estatiicos
app.use(express.static(path.join(__dirname, 'public')))

//Rotas - definindo rotas

app.get('/', function (req, res){
  Postagem.find().lean().populate('categoria').sort(({data: 'desc'})).then((postagens)=>{
    res.render('index', {postagens: postagens})
  }).catch((err)=>{
    console.log(err)
    req.flash('error_msg', 'Erro ao carregar postagens')
    res.redirect('/404')
  })
})
app.get('/404', function(req, res){
  res.send('Erro 404 !')
})

app.get('/postagem/:slug', function(req, res){
  Postagem.findOne({slug: req.params.slug}).lean().then((postagem)=> {
    if (postagem) {
      res.render('postagem/index', {postagem: postagem})
    } else {
      req.flash('error_msg', 'Erro, postagem não existe')
      res.redirect('/')
    }
  }).catch((err)=>{
    req.flash('error_msg', 'ocorreu um erro ao tentar carregar a postagem')
    res.redirect('/')
  })
})

app.get('/categorias', function(req, res){
  Categoria.find().lean().then((categorias)=> {
    res.render('categorias/index', {categorias: categorias})
  }).catch((err)=> {
    req.flash('error_msg', 'Erro ao listar as categorias')
    res.redirect('/')
  })
})

app.get('/categorias/:slug', function(req, res){
  Categoria.findOne({slug: req.params.slug}).lean().then((categoria)=> {
    if (categoria) {
      Postagem.find({categoria: categoria._id}).lean().then((postagens)=> {
        res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
      }).catch((err)=>{
        req.flash('erro_msg', 'Erro ao listar posts')
        res.redirect('/')
      })
    } else {
      req.flash('error_msg', 'Categoria não existe')
      res.redirect('/')
    }
  }).catch((err)=>{
    req.flash('erro_msg', 'Erro ao carregar a pagina')
    res.redirect('/')
  })
})

app.use('/admin', admin)

app.use('/usuarios', usuarios)

//Outros
const PORT = 8081
app.listen(PORT, ()=>{
  console.log('Servidor rodando')
})
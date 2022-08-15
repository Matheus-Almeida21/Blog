const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Categoria')
const Categoria = mongoose.model('categorias')
require('../models/Postagem')
const Postagem = mongoose.model('postagens')
const {eAdmin} = require('../helpers/eAdmin')

//rota admin
router.get('/', eAdmin, function(req, res){
  res.render('./admin/index')
})

//rota categorias
router.get('/categorias', eAdmin, function(req, res){
  Categoria.find().sort({date: 'desc'}).lean().then((categorias)=>{
    res.render('admin/categorias', {categorias: categorias})
  }).catch(()=>{
    req.flash('error_msg', 'Houve um erro ao listar as categorias')
    res.redirect('/admin')
  })
})
//criar categoria
router.get('/categorias/add', eAdmin, function (req, res){
  res.render('admin/addcategoria')
})

router.post('/categorias/nova', eAdmin, function(req, res){
  var erros = []

  if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
    erros.push({texto: "Nome inválido"})
  }
  if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
    erros.push({texto: "Slug inválido"})
  }
  if (req.body.nome.length < 2) {
    erros.push({texto: "Nome da categoria é muito pequeno"})
  }
  if (erros.length > 0) {
    res.render('admin/addcategoria', {erros: erros})
  } else {
    const novaCategoria = {
      nome : req.body.nome,
      slug : req.body.slug
    }
  
    new Categoria(novaCategoria).save().then(()=>{
      req.flash('success_msg', 'Categoria criada com sucesso')
      res.redirect('/admin/categorias')
    }).catch((err)=>{
      req.flash('error_msg', 'Houve um erro ao salvar a categoria')
      res.redirect('admin')
    })
  }
})
//editar categoria
router.get('/categorias/edit/:id', eAdmin, function(req, res){
  Categoria.findOne({_id: req.params.id}).lean().then((categoria)=>{
    res.render('admin/editcategorias', {categoria: categoria})
  }).catch((err)=>{
    req.flash('error_msg', 'Esta categoria não existe')
    res.redirect('/admin/categorias')
  })
})

router.post('/categorias/edit', eAdmin, function(req, res){
  Categoria.findOne({_id: req.body.id}).then((categoria)=>{
    categoria.nome = req.body.nome
    categoria.slug = req.body.slug

    categoria.save().then(()=>{
      req.flash('success_msg', 'Categoria editada com sucesso')
      res.redirect('/admin/categorias')
    }).catch((err)=>{
      req.flash('error_msg', 'Houve um erro ao salvar a edição da categoria')
      res.redirect('/admin/categorias')
    })
  }).catch((err)=>{
    req.flash('error_msg', 'Houve um erro ao editar a categoria')
    res.redirect('/admin/categorias')
  })
})
//deletar categoria
router.post('/categorias/deletar', eAdmin, function(req, res){
  Categoria.remove({_id: req.body.id}).then(()=>{
    req.flash('success_msg', 'Categoria deletada com sucesso')
    res.redirect('/admin/categorias')
  }).catch((err)=>{
    req.flash('error_msg', 'Erro ao tentar deletar categoria')
    res.redirect('/admin/categorias')
  })
})

//Rota postagens
router.get('/postagens', eAdmin, function (req, res){
  Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens)=>{
    res.render('admin/postagens', {postagens: postagens})
  }).catch((err)=>{
    req.flash('error_msg', 'Houve um erro ao listar as postagens')
    res.redirect('/admin')
  })
})
//Rota criação de postagens
router.get('/postagens/add', eAdmin, function(req, res){
  Categoria.find().lean().then((categorias)=>{
    res.render('admin/addpostagem',{categorias: categorias})
  }).catch((err)=>{
    req.flash('error_msg', 'Houve um erro ao carregar o formulário')
    res.redirect('/admin')
  })
})

router.post('/postagens/nova', eAdmin, function(req, res){
  //validando parte de categoria
  var erros = []

  if (req.body.categoria == '0') {
    erros.push({texto: 'Categoria invalida, registre uma categoria'})
  }
  if (erros.length > 0) {
    res.render('admin/addpostagem', {erros: erros})
  } else {
    const novaPostagem = {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      conteudo: req.body.conteudo,
      categoria: req.body.categoria,
      slug: req.body.slug
    }

    new Postagem(novaPostagem).save().then(()=>{
      req.flash('success_msg', 'Postagem criada com sucesso')
      res.redirect('/admin/postagens')
    }).catch((err)=>{
      req.flash('error_msg', 'Houve um erro ao salvar a postagem')
      res.redirect('/admin/postagens')
      console.log(err)
    })
  }

})
//Rota edição de postagens
router.get('/postagens/edit/:id', eAdmin, function(req, res){ //fazendo duas pesquisas de uma vez no mongo
  Postagem.findOne({_id: req.params.id}).lean().then((postagem)=>{ //pesquisando primeiro a postagem
    Categoria.find().lean().then((categorias)=>{ //pesquisando em seguida a categoria
      res.render('admin/editpostagens', {categorias: categorias, postagem: postagem})
    }).catch((err)=>{
      console.log(err)
      req.flash('error_msg', 'Erro ao listar as categorias')
      res.redirect('/admin/postagens')
    })
  }).catch((err)=>{
    req.flash('error_msg', 'Erro ao carregar o formulario')
    res.redirect('/admin/postagens')
  })
})
router.post('/postagem/edit', eAdmin, function(req, res){
  Postagem.findOne({_id: req.body.id}).then((postagem)=>{
      postagem.titulo = req.body.titulo
      postagem.descricao = req.body.descricao
      postagem.conteudo = req.body.conteudo
      postagem.categoria = req.body.categoria
      postagem.slug = req.body.slug

      postagem.save().then(()=>{
        req.flash('success_msg', 'Sucesso ao salvar edição')
        res.redirect('/admin/postagens')
      }).catch((err)=>{
        req.flash('error_msg', 'Erro ao tentar salvar edição')
        res.redirect('/admin/postagens')
      })
  }).catch((err)=>{
    req.flash('error_msg', 'Erro ao tentar salvar edição')
    res.redirect('/admin/postagens')
  })
})
//Rota exclusão de postagens
router.get('/postagens/deletar/:id', eAdmin, function(req, res){
  Postagem.remove({_id: req.params.id}).then(()=>{
    req.flash('success_msg', 'Postagem deletada com sucesso')
    res.redirect('/admin/postagens')
  }).catch((err)=> {
    req.flash('error_msg', 'Erro ao deletar postagem')
    res.redirect('/admin/postagens')
  })
})

module.exports = router
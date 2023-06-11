
class MMTokenizer
{
  static specialChars = "!\"#$%&'()*+,-./:"
                 + ";<=>?@[\\]^_`{|}~";

  static whiteSpaceChars = " \t\r\n\f";

  static isAlphaNumeric(c)
  {
    if("a" <= c && c <= "z")
      return true;
    if("A" <= c && c <= "Z")
      return true;
    if("0" <= c && c <= "9")
      return true;
    return false;
  }
  
  static isSpecial(c)
  {
    return MMTokenizer.specialChars.indexOf(c) !== -1;
  }

  static isWhiteSpace(c)
  {
    return MMTokenizer.whiteSpaceChars.indexOf(c) !== -1;
  }

  static isNonWhiteSpace(c)
  {
    return MMTokenizer.isAlphaNumeric(c) || MMTokenizer.isSpecial(c);
  }
  
  static EOF = "$EOF";
  
  constructor(s)
  {
    this.dbString = s;
    this.dbStringIdx = 0;
    this.curTok = null;
    this.curTokIdx;
    this.nextToken();
  }
  
  curChar()
  {
    return this.dbString.charAt(this.dbStringIdx)
  }
  
  nextTokenRaw()
  {
    if(this.curTok === MMTokenizer.EOF)
        throw "nextTokenRaw: Already at EOF!";

    var t = "";
    
    while(this.dbStringIdx < this.dbString.length 
          && MMTokenizer.isWhiteSpace(this.curChar()))
      this.dbStringIdx++;
      
    if(this.dbStringIdx >= this.dbString.length)
    {
      this.curTok = MMTokenizer.EOF;
      return;
    }
    
    this.curTokIdx = this.dbStringIdx;
    
    while(this.dbStringIdx < this.dbString.length 
            && !MMTokenizer.isWhiteSpace(this.curChar()))
    {
      if(!MMTokenizer.isNonWhiteSpace(this.curChar()))
        throw "nextTokenRaw: Unexpected character: " + this.curChar();
      t = t + this.curChar();
      this.dbStringIdx++;
    }
    
    this.curTok = t;
  }

  nextToken()
  {
    this.nextTokenRaw();
    
    while(this.curTok === "$(")
    {
      this.nextTokenRaw();
      while(this.curTok !== "$)" && this.curTok !== MMTokenizer.EOF)
        this.nextTokenRaw();
      if(this.curTok === MMTokenizer.EOF)
        throw "nextToken: EOF inside comment";
      this.nextTokenRaw();
    }
    
    return this.curTok;
  } 
}

class MMStatement
{
  //new MMStatement(t), with t a tokenizer, parses the next statement.
  //new MMStatement(idx, label, keyword, typecode, assertion, proof)
  //just assigns the arguments to the corresponding fields.
  constructor(toridx, label, keyword, typecode, assertion, proof)
  {
    if(arguments.length == 6)
    {
      this.idx = toridx;
      this.label = label;
      this.keyword = keyword;
      this.typecode = typecode;
      this.assertion = assertion;
      this.proof = proof;
      return;
    }
    
    let t = toridx;
    if(t.curTok === MMTokenizer.EOF)
      throw "MMStatement constructor: EOF!";
      
    this.idx = t.curTokIdx;
    
    if(t.curTok.indexOf("$") === -1)
    {
      this.label = t.curTok;
      t.nextToken();
    }
    else
      this.label = null;
    
    if(t.curTok === MMTokenizer.EOF)
      throw "MMStatement constructor: Unexpected EOF after label";
      
      
    this.keyword = t.curTok;
    
    t.nextToken();
    
    switch(this.keyword)
    {
    case "${":
    case "$}":
      this.typecode = null;
      this.assertion = null;
      this.proof = null;
      return;
    case "$c":
    case "$v":
    case "$d":
      this.typecode = null;
      break;
    case "$f":
    case "$e":
    case "$a":
    case "$p":
      if(t.curTok === MMTokenizer.EOF)
        throw "MMStatement constructor: Unexpected EOF after keyword";
      this.typecode = t.curTok;
      t.nextToken();
      break;
    default:
      throw "MMStatement constructor: Unexpected keyword: " + this.keyword;
    }
    
    this.assertion = [];
    
    while(t.curTok !== "$=" && t.curTok !== "$.")
    {
      if(t.curTok === MMTokenizer.EOF)
        throw "MMStatement constructor: Unexpected EOF in assertion part"
      this.assertion.push(t.curTok);
      t.nextToken();
    }
    
    if(t.curTok === "$.")
    {
      this.proof = null;
      t.nextToken();
      return;
    }
    
    t.nextToken(); //Skip $=
    
    this.proof = [];
    
    while(t.curTok !== "$.")
    {
      if(t.curTok === MMTokenizer.EOF)
        throw "MMStatement constructor: Unexpected EOF in proof"
      this.proof.push(t.curTok);
      t.nextToken();
    }
    
    t.nextToken();
  }
  
  toString()
  {
    let s;
    if(this.label !== null)
      s = this.label + " ";
    else 
      s = "";
    s += this.keyword + " " + (this.typecode !== null ? this.typecode + " " : "")
          + (this.assertion !== null ? this.assertion.join(" ") : "");
    return s;
  }
  
  //Modified from https://stackoverflow.com/a/7616484
  static hashString(s)
  {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      let chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash >>> 0;  //Reinterpret hash as a 32bit *unsigned* number
  }
  
  hashCode()
  {
    return MMStatement.hashString(this.assertion.join(" "));
  }
  
  //Returns the hash code of this.assertion as a string of
  //eight hex digits.
  hashCodeString()
  {
    return this.hashCode().toString(16).padStart(8, "0");
  }
}

//A scope is simply a list of $d, $e and $f statements.

//A MMThm is basically a $a or $p statement together with its hypotheses
class MMThm
{
  constructor(stmt, scope, MSCategory)
  {
    var vs = new Set();
    
    function addVars(ts)
    {
      for(let t of ts)
      {
        if(MSCategory.get(t) === MMDb.MSCATVAR)
          vs.add(t);
      }
    }
    
    if(!(stmt.keyword === "$a" || stmt.keyword === "$p"))
      throw "MMThm constructor: Statement with unexpected keyword: " + stmt.keyword;

    this.stmt = stmt;
    
    addVars(stmt.assertion);
    for(let hyp of scope)
    {
      if(hyp.keyword === "$e")
        addVars(hyp.assertion);
    }
    
    this.hyps = [];
    for(let hyp of scope)
    {
      switch(hyp.keyword)
      {
      case "$d":
        //FIXME
        break;
      case "$e":
        this.hyps.push(hyp);
        break;
      case "$f":
        if(hyp.assertion.length !== 1)
          throw "MMThm constructor: Assertion of $f statement has wrong length.";
        if(vs.has(hyp.assertion[0]))
          this.hyps.push(hyp);
        break;
      default:
        throw "MMThm constructor: Hyp with unexpected keyword: " + hyp.keyword;
      }
    }
  }
  
  toString(inclFloatHyps)
  {
    let s = "{\n";
    
    for(let hyp of this.hyps)
    {
      if(hyp.keyword === "$e" || (hyp.keyword === "$f" && inclFloatHyps))
        s += "  " + hyp.toString() + "\n";
    }
    
    s += "  " + this.stmt.toString();
    s += "\n}";
    
    return s;
  }
}

class MMDb
{
  //this.MSCategory is a map from math symbols to one of these two values
  static MSCATVAR = "$v";     //for variables
  static MSCATCONST = "$c";   //for constants 
  
  constructor(s, paThmLabel)
  {       
    this.rawString = s;   
    this.MSCategory = new Map();
    this.thmMap = new Map; //Maps theorem name to instance of MMThm
    this.mathParser = new MathParser(this.MSCategory);
    
    let scopes = [[]];

    let t = new MMTokenizer(s);
    
    while(t.curTok !== MMTokenizer.EOF && !this.paThm)
    {
      let stmt = new MMStatement(t);
      //console.log(stmt.toString());
      if(this.thmMap.size % 1000 === 0)
        console.log("thmMap.size = " + this.thmMap.size);
      switch(stmt.keyword)
      {
      case "$c":
        for(let c of stmt.assertion)
          this.MSCategory.set(c, MMDb.MSCATCONST);
        break;
      case "$v":
        for(let v of stmt.assertion)
          this.MSCategory.set(v, MMDb.MSCATVAR);
        break;
         case "$d":
      case "$e":
        scopes.at(-1).push(stmt);
        break;
      case "$f":
        scopes.at(-1).push(stmt);
        if(stmt.assertion.length !== 1)
          throw "MMDb constructor: Unexpected length of $f statement with label: " + stmt.label;
        break;
      case "$a":
      case "$p":
        var thm = new MMThm(stmt, scopes.at(-1), this.MSCategory);
        //console.log(thm.toString(true));
        if(thm.stmt.typecode === "|-")
        {
          //let parseTree = this.mathParser.parseMathExpr(thm.stmt.assertion, "wff", MMDb.varTypesOfHyps(thm.hyps));
          //console.log("From parse tree: " + parseTree.toString());
          if(thm.stmt.label === paThmLabel)
          {
            this.paThm = thm;
            this.paScope = scopes.at(-1);
          }
          else
            this.thmMap.set(thm.stmt.label, thm);
        }
        else
        {
          this.thmMap.set(thm.stmt.label, thm);
          this.mathParser.addGrammarRule(thm);
        }
        break;
      case "${":
        var nb = scopes.at(-1).slice();
        scopes.push(nb);
        break;
      case "$}":
        if(scopes.length <= 1)
          throw "MMDb constructor: To many '$}'s";
        scopes.pop();
        break;
      default:
        throw "MMDb constructor: Unexpected keyword: " + stmt.keyword;
      }
    } 
  }
  
  //Utility function. Returns a map (var name => typecode) with
  //an entry for each $f statement.
  static varTypesOfHyps(hyps)
  {
    var varTypes = new Map()
    
    for(let hyp of hyps)
    {
      if(hyp.keyword === "$f")
        varTypes.set(hyp.assertion[0], hyp.typecode);
    }

    return varTypes;
  }
  
  static substTokList(ts, substMap)
  {
    let a = [];
    for(let t of ts)
    {
      let tp = substMap.get(t);
      if(tp !== undefined)
        a.push(...tp);
      else
        a.push(t);
    }
    return a;
  }
}
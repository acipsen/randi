class GrammarRule
{
  constructor(label, lhs, rhs)
  {
    this.label = label;
    this.lhs = lhs; //lhs is a typecode
    this.rhs = rhs; //rhs is a list of tokens
  }
  
  toString()
  {
    return "$" + this.lhs + " -> " + this.rhs.join(" ");
  }
}

class ParseTree
{
  constructor()
  {
    if(this.constructor == ParseTree)
      throw "The abstract ParseTree class should not be instantiated!";
  }
  
  toString()
  {
    return this.toTokenList().join(" ");
  }
}

class VarNode extends ParseTree
{
  constructor(typecode, varName)
  {
    super();
    this.typecode = typecode;
    this.varName = varName;
  }
  
  toTokenList()
  {
    return [this.varName];
  }
}

class RuleNode extends ParseTree
{
  constructor(typecode, rule, childNodes)
  {
    super();
    this.typecode = typecode;
    this.rule = rule;
    this.childNodes = childNodes;
  }
  
  toTokenList()
  {
    let childIdx = 0;
    let toks = [];
    for(let t of this.rule.rhs)
    {
      if(t.indexOf("$") === -1)
      {
        toks.push(t);
      }
      else
      {
       toks.push(...this.childNodes[childIdx].toTokenList());
       childIdx++;
      }
    }
    return toks;
  }
}

class MathParser
{
  //Idea: For some n (maybe 3?) collect all rules with at least
  //n elements on the rhs in a map keyed by the last n elements
  //of the rhs. n should be chosen such that there are not to many
  //rules with the same key. 
  //Collect rules with less than n elements in separate
  //maps/lists.
  
  //Another idea: Construct a map from tokens (we should probably exclude
  //very common tokens such as brackets) to all grammar rules with this 
  //token on the rhs. Then the parser should only need to look through
  //a small number of relevant rules at each step.
  
  constructor(MSCategory)
  {
    this.grammarTable = [];
    this.MSCategory = MSCategory; //The MSCategory map is created and updated by MMDb
  }
  
  addGrammarRule(thm)
  {
    let varTypes = MMDb.varTypesOfHyps(thm.hyps);

    let rhs = [];
    
    for(let i = 0; i < thm.stmt.assertion.length; i++)
    {
      let t = thm.stmt.assertion[i];
      let ty = varTypes.get(t);
      rhs.push(ty ? "$" + ty : t);
    }
    
    this.grammarTable.push(new GrammarRule(thm.stmt.label, thm.stmt.typecode, rhs));
    console.log(this.grammarTable.at(-1).toString());
  }
  
  static parseTreesEq(t1, t2)
  {
    if(t1 instanceof VarNode)
    {
      return t1.varName === t2.varName;
    }
    else if(t2 instanceof VarNode)
    {
      return false;
    }
    else
    {
      if(t1.rule !== t2.rule)
        return false;
      let cs1 = t1.childNodes;
      let cs2 = t2.childNodes;
      if(cs1.length !== cs2.length)
        throw "parseTreesEq: Trees have same rule but different number of children."
      for(let i = 0;i < cs1.length;i++)
      {
        if(!parseTreesEq(c1[i], c2[i]))
          return false;
      }
      return true;
    }
  }
  
  //The paser stack is a list where each element is either a string 
  //(corresponding to constant math symbol) or a parse tree.
  
  //Match the given GrammarRule against the top rule.rhs.length elements
  //of the parser stack. Return the corresponding RuleNode if successful,
  //otherwise false.
  matchStackTop(rule, stack)
  {
    let rhs = rule.rhs;
    if(rhs.length > stack.length)
      return false;
    let childNodes = [];
    for(let i = -rhs.length; i <= -1; i++)
    {
      let se = stack.at(i);
      let re = rhs.at(i);
      if(re.indexOf("$") === -1)
      {
        if(se !== re)
          return false;
      }
      else
      {
        if(typeof se === "string")
          return false;
        if("$" + se.typecode !== re)
          return false;
        childNodes.push(se);
      }
    }
    return new RuleNode(rule.lhs, rule, childNodes);
  }
  
  static parserStackToString(stack)
  {
    let s = ""
    for(let se of stack)
    {
      if(typeof se === "string")
        s += se + " ";
      else
        s += "{" + se.typecode + "} ";
    }
    return s;
  }
  
  tryParseMathExpr(tIdx, stack, ts, typecode, varTypes)
  {
    //console.log("Math stack: " + MathParser.parserStackToString(stack));
    
    if(tIdx === ts.length && stack.length === 1)
    {
      let node = stack[0];
      if(typeof node !== "string" && node.typecode === typecode)
        return node;
    }
    
    for(let r of this.grammarTable)
    {
      let newNode = this.matchStackTop(r, stack);
      if(newNode === false)
        continue;
      let newStack = stack.slice(0, stack.length - r.rhs.length);
      newStack.push(newNode);
      let retVal = this.tryParseMathExpr(tIdx, newStack, ts, typecode, varTypes);
      if(retVal !== false)
        return retVal;
    }
    
    if(tIdx < ts.length)
    {
      let t = ts[tIdx];
      let newStack = stack.slice();
      if(this.MSCategory.get(t) === MMDb.MSCATVAR)
      {
        newStack.push(new VarNode(varTypes.get(t), t))
      }
      else
        newStack.push(t);
      return this.tryParseMathExpr(tIdx + 1, newStack, ts, typecode, varTypes);
    }
    
    return false;
  }
  
  parseMathExpr(ts, typecode, varTypes)
  {
    console.log("parseMathExpr: Trying to parse as " + typecode + ": " + ts.join(" "));
    let retVal = this.tryParseMathExpr(0, [], ts, typecode, varTypes);
    if(retVal === false)
    {
      console.log("parseMathExpr: Failure.");
      throw "parseMathExpr: Failed to parse: " + ts.join(" ");
    }
    else
    {
      console.log("parseMathExpr: Success.");
      return retVal;
    }
  }
  
  parseThm(thm)
  {
    return this.parseMathExpr(thm.stmt.assertion, "wff", MMDb.varTypesOfHyps(thm.hyps));
  }
}
  $v ph $.  $( Greek phi $)
  $v ps $.  $( Greek psi $)
  $v ch $.  $( Greek chi $)
  
  $( Let variable ` ph ` be a wff. $)
  wph $f wff ph $.
  $( Let variable ` ps ` be a wff. $)
  wps $f wff ps $.
  $( Let variable ` ch ` be a wff. $)
  wch $f wff ch $.
  
  wi $a wff ( ph -> ps ) $.
  wa $a wff ( ph /\ ps ) $.
  wn $a wff -. ph $.
  

  id $p |- ( ph -> ph ) $= ? $.
  
  ${
    mtand.1 $e |- ( ph -> -. ch ) $.
    mtand.2 $e |- ( ( ph /\ ps ) -> ch ) $.
    mtand $p |- ( ph -> -. ps ) $= ? $.
  $}
  

  simpr $p |- ( ( ph /\ ps ) -> ps ) $= ? $.
  
  ${
    simprd.1 $e |- ( ph -> ( ps /\ ch ) ) $.
    simprd $p |- ( ph -> ch ) $= ? $.
  $}
  
  ${
    intnand.1 $e |- ( ph -> -. ps ) $.
    intnand $p |- ( ph -> -. ( ch /\ ps ) ) $= ? $.
  $}
  
class TestDB
{
  static s =   
 `$v ph $.  $( Greek phi $)
  $v ps $.  $( Greek psi $)
  $v ch $.  $( Greek chi $)
  $v th $.  $( Greek chi $)
  
  wph $f wff ph $.
  wps $f wff ps $.
  wch $f wff ch $.
  wth $f wff th $.
  
  wi $a wff ( ph -> ps ) $.
  wa $a wff ( ph /\ ps ) $.
  wn $a wff -. ph $.
  wo $a wff ( ph \/ ps ) $.
  

  id $p |- ( ph -> ph ) $= ? $.
  
  \${
    mtand.1 $e |- ( ph -> -. ch ) $.
    mtand.2 $e |- ( ( ph /\ ps ) -> ch ) $.
    mtand $p |- ( ph -> -. ps ) $= ? $.
  $}
  

  simpr $p |- ( ( ph /\ ps ) -> ps ) $= ? $.
  
  \${
    simprd.1 $e |- ( ph -> ( ps /\ ch ) ) $.
    simprd $p |- ( ph -> ch ) $= ? $.
  $}
  
  \${
    jaodan.1 $e |- ( ( ph /\ ps ) -> ch ) $.
    jaodan.2 $e |- ( ( ph /\ th ) -> ch ) $.
    jaodan.3 $e |- ( ph -> ( ps \/ th ) ) $.
    mpjaodan $p |- ( ph -> ch ) $= ? $.
  $}
  
  exmidd $p |- ( ph -> ( ps \/ -. ps ) ) $= ? $.
  
  \${
    mpd.1 $e |- ( ph -> ps ) $.
    mpd.2 $e |- ( ph -> ( ps -> ch ) ) $.
    mpd $p |- ( ph -> ch ) $= ? $.
  $}
  
  \${
    adantr.1 $e |- ( ph -> ps ) $.
    adantr $p |- ( ( ph /\ ch ) -> ps ) $= ? $.
  $}
  
  \${
    ex.1 $e |- ( ( ph /\ ps ) -> ch ) $.
    ex $p |- ( ph -> ( ps -> ch ) ) $= ? $.
  $}
  
  \${
    pm2.21dd.1 $e |- ( ph -> ps ) $.
    pm2.21dd.2 $e |- ( ph -> -. ps ) $.
    pm2.21dd $p |- ( ph -> ch ) $= ? $.
  $}
  
  \${
    $( $ap mtand $, ps  $ap simprd $, ch $)
    intnand.1 $e |- ( ph -> -. ps ) $.
    intnand $p |- ( ph -> -. ( ch /\ ps ) ) $= ? $.
  $}
  
  $(
    $ap mpjaodan $, ph $, -. ph 
    $ap exmidd 
    $ap mpd $, ( ph -> ps ) 
    $ap ex 
    $ap pm2.21dd $, ph 
  $)
  peirce $p |- ( ( ( ph -> ps ) -> ph ) -> ph ) $= ? $.`;
  
  static proofScript = 
`$ap mpjaodan $, ph $, -. ph 
$ap exmidd 
$ap mpd $, ( ph -> ps ) 
$ap ex 
$ap pm2.21dd $, ph `;
}
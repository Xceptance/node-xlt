package tests.demo;
import org.junit.Test;
import static org.junit.Assert.assertEquals;


public class TDemoCase {
	
   String message1 = "Hello World";	
   String message2 = "Hello World";	

   @Test
   public void testMessages() {
      assertEquals(message1,message2);
   }
}
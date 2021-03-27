import * as React from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, Button, Image, KeyboardAvoidingView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import styles from '../../globalStyles';


class NiceButton extends React.Component {
  constructor(props) {super(props);}
  render() {
    return (
      <TouchableOpacity style={styles.button} onPress={this.props.onPress}>
        <Text style={styles.buttonText}>{this.props.title}</Text>
      </TouchableOpacity>
    );
  }
}

class SavedItem extends React.Component {
  constructor(props) {super(props);}
  render() {
    return (
      <TouchableOpacity style={localStyle.savedItem} onPress={this.props.onPress}>
        <Text style={localStyle.savedTextTitle}>{this.props.item.name}{"\n"}</Text>
        <View style={{flexDirection: "row", width: "100%"}}>
          <Text style={[localStyle.savedText, {flexGrow: 1}]}>{this.props.item.detail1}</Text>
          <Text style={localStyle.savedText}>{this.props.item.detail2}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

function getSaved() {
  return {
    type: "profile",
    entries: [
      {name: "Dave Perkins", detail1: "Computer Science", detail2: "Undergrad"},
      {name: "Stacey Smom", detail1: "Computer Science", detail2: "Undergrad"},
      {name: "Drew Peacock", detail1: "Computer Science", detail2: "Undergrad"},
      {name: "Pete Dacat", detail1: "Computer Science", detail2: "Undergrad"},
      {name: "Phillipe Null", detail1: "Computational Media", detail2: "Graduate"},
      {name: "Dan Ghost", detail1: "Computational Media", detail2: "Undergrad"},
      {name: "Josh Netter", detail1: "Computer Science", detail2: "Graduate"}
    ]
  };
}

export const SaveContainer = ({ navigation }) => {
  const saved = getSaved();
  let i = 0;
  let elements = (
    <KeyboardAvoidingView>
      {saved.entries.map((item)=>(
        <SavedItem item={item} key={i++}/>
      ))}
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container} >
    <ScrollView /* contentContainerStyle={ styles.container } */>
      {elements}
    </ScrollView>
      <View style={ localStyle.navButtonContainer }>
        <NiceButton title="Exit" onPress={() => navigation.goBack()}/>
      </View>
    </View>
  );
};

const Stack = createStackNavigator();

export default function ViewSaved( props ) {


  return (
    <Stack.Navigator screenOptions = {{headerShown: false}} initialRouteName="View">
      <Stack.Screen name="View" component={SaveContainer} />
    </Stack.Navigator>
  );
};

const localStyle = StyleSheet.create({//File-specific
  navButtonContainer: {
    position: "absolute",
    bottom: 0,
    alignSelf: 'center',
    //width: "100%",
    backgroundColor: '#F5F5F5',
    flexDirection: "row",
    alignItems: 'stretch',
    justifyContent: 'center',
    margin: 5,
    marginTop: 5
  },
  savedItem: {
      backgroundColor: "#F5F5F5",
      //backgroundColor: "red",
      height: 80,
      borderColor: "black",
      borderWidth: 2,
      borderRadius: 15,
      padding: 5,
      margin: 1
  },
  savedTextTitle: {
    color: "#B3A369",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    margin: 2,
    marginBottom: -15
  },
  savedText: {
    color: "black",
    fontSize: 15,
    fontWeight: "bold",
    margin: 2
  },
  container: {
      backgroundColor: '#F5F5F5',
      color: '#F5F5F5',
      //opacity: 100,
      padding: 15,
      marginTop: 30,
      flex: 1
  }
});

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ImageBackground } from "react-native";
import axios from "axios";
import moment from "moment";

const CronData = () => {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCronData = async (reset = false) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://192.168.1.3:5001/api/weekendorder/weekend-orders`, {
        params: { month, year, page, limit: 10 },
      });

      if (res.data.success) {
        const newData = res.data.data || [];
        setHasNextPage(res.data.pagination?.hasNextPage || false);
        setData(reset ? newData : [...data, ...newData]);
      }
    } catch (error) {
      console.error("Error fetching cron data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCronData(true); // refetch when month/year changes
  }, [month, year]);

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) fetchCronData();
  }, [page]);

  // Month/Year change handlers
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const renderItem = ({ item }) => (
    <View  style={styles.card}>
    <View>
      <Text style={styles.date}>{moment(item.executedDate).format("DD MMM YYYY, hh:mm A")}</Text>
      <Text style={[styles.txtxolor,]}>Cron Status{" "}: <Text style={{color:item.status=='FAILED'?'red':item.status=='COMPLETED'&&'green',}}>{item.status}</Text></Text>
      <Text style={styles.txtxolor}>Market Open{" "}: {item.isMarket ? "Yes" : "No"}</Text>
     
    </View>
     <View>
       <Text style={styles.txtxolor}>Buy Gm: {item.buyGM}</Text>
      <Text  style={styles.txtxolor}>Sell Gm: {item.sellGM}</Text>
    </View>

    </View>
  );

  return (

        <ImageBackground 
      source={require('../../asset/images/bg-img.png')} // your background image path
    //   style={styles.backgroundImage}
    style={styles.container}
      resizeMode="cover"
    >
    <View >
   

      {/* Month / Year Controls */}
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.filterBtn}>
          <Text style={styles.arrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{moment(`${year}-${month}`, "YYYY-M").format("MMMM YYYY")}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.filterBtn}>
          <Text  style={styles.arrow}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Data List */}
      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
           ListEmptyComponent={
    !loading && (
      <View style={{ marginTop: 50, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: 'white' }}>No Records.</Text>
      </View>
    )
  }
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn}>
                <Text style={styles.loadMoreText}>
                  {loading ? "Loading..." : "Load More"}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
    </ImageBackground>
  );
};

export default CronData;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingTop: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
   backgroundColor: "#e4e8e6",
    padding: 12,
    flexDirection:'row',
    justifyContent:'space-between',
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  date: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#023020"
  },
  txtxolor:{
     color: "#023020"
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  filterBtn: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    width:40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color:'white'
  },
    arrow:{
    fontSize: 24,
    fontWeight: "bold",
    color:'#023020'
  },
  loadMoreBtn: {
    marginTop: 10,
    backgroundColor: "#056e49",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#fff",
    fontWeight: "600",
  },
});
